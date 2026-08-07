package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.DailyOrderCountPoint;
import lsy.toy.backend.Dto.MonthlyOrderCountPoint;
import lsy.toy.backend.Dto.MonthlyRevenuePoint;
import lsy.toy.backend.Dto.OrderCountStatsResponse;
import lsy.toy.backend.Dto.OrderItemRevenueRow;
import lsy.toy.backend.Dto.OrderPreview;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.OrderRevenueRow;
import lsy.toy.backend.Dto.RevenueByGroup;
import lsy.toy.backend.Dto.SalesBreakdownResponse;
import lsy.toy.backend.Dto.SalesResponse;
import lsy.toy.backend.Entity.CartItem;
import lsy.toy.backend.Entity.Coupon;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.OrderItem;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.CouponRepository;
import lsy.toy.backend.Repository.OrderItemRepository;
import lsy.toy.backend.Repository.OrderRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    // 💡 관리자 페이지의 주문 상태 셀렉트에서 그대로 쓸 수 있도록 표시용 한글 문자열을 그대로 저장한다.
    private static final Set<String> VALID_STATUSES =
        Set.of("결제완료", "배송준비중", "배송중", "배송완료", "주문취소");

    // 💡 결제 페이지의 결제수단 라디오 버튼과 동일한 값. 프론트와 표시 문자열을 맞춰 그대로 저장한다.
    private static final Set<String> VALID_PAYMENT_METHODS =
        Set.of("카카오페이", "토스페이먼츠");

    // 💡 공동현관 출입방법 라디오 버튼과 동일한 값.
    private static final Set<String> VALID_ENTRY_METHODS =
        Set.of("비밀번호", "경비실호출", "자유출입가능", "기타사항");

    // 💡 결제 완료 시 실제 결제 금액(적립금 사용분 차감 후)의 1%를 적립한다.
    private static final int POINT_EARN_RATE_PERCENT = 1;

    // 💡 매출은 주문이 실제로 발생한 한국 시각 기준 날짜로 집계한다(DB의 createdAt은 UTC Instant).
    private static final ZoneId SALES_ZONE = ZoneId.of("Asia/Seoul");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;

    public OrderService(
        OrderRepository orderRepository,
        OrderItemRepository orderItemRepository,
        CartItemRepository cartItemRepository,
        UserRepository userRepository,
        CouponRepository couponRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
    }

    @Transactional
    public OrderResponse createOrderFromCart(String email, CreateOrderRequest request) {
        validateOrderRequest(request);

        User user = findUser(email);
        List<CartItem> cartItems = cartItemRepository.findByUser_IdOrderByIdAsc(user.getId());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장바구니가 비어 있습니다.");
        }

        PricingResult pricing = calculatePricing(user, cartItems, request);

        user.setPoints(user.getPoints() - pricing.usedPoints() + pricing.earnedPoints());
        userRepository.save(user);

        String entryMethod = request.getEntryMethod();
        Order order = new Order(user, pricing.totalPrice());
        order.setDiscountAmount(pricing.discountAmount());
        order.setRecipientName(request.getRecipientName().trim());
        order.setRecipientPhone(request.getRecipientPhone().trim());
        order.setZipCode(request.getZipCode().trim());
        order.setAddress(request.getAddress().trim());
        order.setAddressDetail(isBlank(request.getAddressDetail()) ? null : request.getAddressDetail().trim());
        order.setDeliveryRequest(isBlank(request.getDeliveryRequest()) ? null : request.getDeliveryRequest().trim());
        order.setEntryMethod(isBlank(entryMethod) ? null : entryMethod);
        order.setEntryNote(isBlank(request.getEntryNote()) ? null : request.getEntryNote().trim());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPointsUsed(pricing.usedPoints());
        order.setPointsEarned(pricing.earnedPoints());
        for (CartItem cartItem : cartItems) {
            order.addItem(new OrderItem(
                cartItem.getProduct().getName(),
                cartItem.getProduct().getCategoryName(),
                cartItem.getProduct().getImageUrl(),
                cartItem.getProduct().getPrice(),
                cartItem.getQuantity(),
                cartItem.getSize(),
                cartItem.getMarkingName(),
                cartItem.getProduct().getTeamName()
            ));
            // 💡 인기순/판매순 정렬이 참조하는 누적 판매 수량. 같은 트랜잭션이라 별도 save 없이 커밋 시 반영된다.
            cartItem.getProduct().incrementSoldCount(cartItem.getQuantity());
        }

        Order saved = orderRepository.save(order);
        cartItemRepository.deleteByUser_Id(user.getId());

        if (pricing.coupon() != null) {
            pricing.coupon().markUsed(saved);
            couponRepository.save(pricing.coupon());
        }

        log.info(
            "주문 생성: orderId={}, userId={}, totalPrice={}, discountAmount={}, pointsUsed={}, pointsEarned={}",
            saved.getId(), user.getId(), pricing.totalPrice(), pricing.discountAmount(), pricing.usedPoints(), pricing.earnedPoints()
        );

        return new OrderResponse(saved);
    }

    // 💡 카카오페이 ready 단계에서 실제 주문 생성 없이 결제 금액/품목명만 미리 계산할 때 쓴다.
    // 검증·금액 계산 로직을 createOrderFromCart와 공유해서, 카카오페이에 청구하는 금액이
    // 실제 주문 생성 시 계산되는 금액과 항상 정확히 일치하도록 보장한다.
    public OrderPreview previewOrder(String email, CreateOrderRequest request) {
        validateOrderRequest(request);

        User user = findUser(email);
        List<CartItem> cartItems = cartItemRepository.findByUser_IdOrderByIdAsc(user.getId());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장바구니가 비어 있습니다.");
        }

        PricingResult pricing = calculatePricing(user, cartItems, request);
        int quantity = cartItems.stream().mapToInt(CartItem::getQuantity).sum();

        return new OrderPreview(pricing.totalPrice(), buildItemName(cartItems), quantity);
    }

    private String buildItemName(List<CartItem> cartItems) {
        String firstName = cartItems.get(0).getProduct().getName();
        return cartItems.size() > 1 ? firstName + " 외 " + (cartItems.size() - 1) + "건" : firstName;
    }

    private void validateOrderRequest(CreateOrderRequest request) {
        if (isBlank(request.getRecipientName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "받는 분을 입력해주세요.");
        }
        if (isBlank(request.getRecipientPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연락처를 입력해주세요.");
        }
        if (isBlank(request.getZipCode()) || isBlank(request.getAddress())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "배송지 주소를 입력해주세요.");
        }
        String paymentMethod = request.getPaymentMethod();
        if (paymentMethod == null || !VALID_PAYMENT_METHODS.contains(paymentMethod)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제수단을 선택해주세요.");
        }
        String entryMethod = request.getEntryMethod();
        if (entryMethod != null && !entryMethod.isBlank() && !VALID_ENTRY_METHODS.contains(entryMethod)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 공동현관 출입방법입니다: " + entryMethod);
        }
    }

    // 💡 user/DB에 아무 것도 쓰지 않는 순수 계산. createOrderFromCart와 previewOrder가 공유한다.
    private PricingResult calculatePricing(User user, List<CartItem> cartItems, CreateOrderRequest request) {
        int totalPrice = cartItems.stream()
            .mapToInt(item -> item.getProduct().getPrice() * item.getQuantity())
            .sum();

        Long couponId = request.getCouponId();
        Coupon coupon = null;
        int discountAmount = 0;
        if (couponId != null) {
            coupon = couponRepository.findByIdAndUser_Id(couponId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "쿠폰을 찾을 수 없습니다: " + couponId));
            if (coupon.getUsedAt() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 사용된 쿠폰입니다.");
            }
            discountAmount = totalPrice * coupon.getDiscountPercent() / 100;
            totalPrice -= discountAmount;
        }

        Integer pointsUsed = request.getPointsUsed();
        int usedPoints = pointsUsed == null ? 0 : pointsUsed;
        if (usedPoints < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "적립금 사용액이 올바르지 않습니다.");
        }
        if (usedPoints > user.getPoints()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "보유한 적립금이 부족합니다.");
        }
        if (usedPoints > totalPrice) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "적립금은 결제 금액을 초과해 사용할 수 없습니다.");
        }
        totalPrice -= usedPoints;

        int earnedPoints = totalPrice * POINT_EARN_RATE_PERCENT / 100;
        return new PricingResult(totalPrice, discountAmount, usedPoints, earnedPoints, coupon);
    }

    private record PricingResult(int totalPrice, int discountAmount, int usedPoints, int earnedPoints, Coupon coupon) {}

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(OrderResponse::new)
            .toList();
    }

    public List<OrderResponse> getMyOrders(String email) {
        User user = findUser(email);
        return orderRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
            .map(OrderResponse::new)
            .toList();
    }

    // 💡 회원 관리 페이지의 회원 상세 보기용 (관리자가 특정 회원의 주문 내역 확인).
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
            .map(OrderResponse::new)
            .toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, String status) {
        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 주문 상태입니다: " + status);
        }

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다: " + orderId));

        boolean newlyCancelled = "주문취소".equals(status) && !"주문취소".equals(order.getStatus());
        order.setStatus(status);
        if (newlyCancelled) {
            refundPoints(order);
        }
        OrderResponse response = new OrderResponse(orderRepository.save(order));

        if (newlyCancelled) {
            log.info("주문 취소: orderId={}, userId={}", orderId, order.getUser().getId());
        }

        return response;
    }

    // 💡 고객 본인 취소: 관리자용 updateStatus와 달리 소유권 검증과 '결제완료' 상태 제약이 들어간다.
    @Transactional
    public OrderResponse cancelMyOrder(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 주문만 취소할 수 있습니다.");
        }
        if (!"결제완료".equals(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제완료 상태의 주문만 취소할 수 있습니다.");
        }

        order.setStatus("주문취소");
        refundPoints(order);
        OrderResponse response = new OrderResponse(orderRepository.save(order));

        log.info("주문 취소(고객): orderId={}, userId={}", orderId, user.getId());

        return response;
    }

    // 💡 주문취소 시 사용했던 적립금은 돌려주고, 그 주문으로 적립됐던 포인트는 회수한다.
    private void refundPoints(Order order) {
        User user = order.getUser();
        user.setPoints(user.getPoints() + order.getPointsUsed() - order.getPointsEarned());
        userRepository.save(user);
    }

    public OrderResponse updateTrackingNumber(Long orderId, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다: " + orderId));

        order.setTrackingNumber(trackingNumber == null || trackingNumber.isBlank() ? null : trackingNumber.trim());
        return new OrderResponse(orderRepository.save(order));
    }

    public SalesResponse getSalesSummary() {
        LocalDate today = LocalDate.now(SALES_ZONE);
        long[] monthlyTotals = new long[12];
        long todayRevenue = 0;
        long monthRevenue = 0;
        long yearRevenue = 0;

        for (OrderRevenueRow row : orderRepository.findRevenueRows()) {
            LocalDate orderDate = row.getCreatedAt().atZone(SALES_ZONE).toLocalDate();
            if (orderDate.getYear() != today.getYear()) {
                continue;
            }

            long price = row.getTotalPrice();
            yearRevenue += price;
            monthlyTotals[orderDate.getMonthValue() - 1] += price;

            if (orderDate.getMonthValue() == today.getMonthValue()) {
                monthRevenue += price;
            }
            if (orderDate.equals(today)) {
                todayRevenue += price;
            }
        }

        List<MonthlyRevenuePoint> monthlyTrend = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            monthlyTrend.add(new MonthlyRevenuePoint(month, monthlyTotals[month - 1]));
        }

        return new SalesResponse(todayRevenue, monthRevenue, yearRevenue, monthlyTrend);
    }

    // 💡 주문 건수 통계 - 매출 집계와 동일한 findRevenueRows()를 재사용해 주문취소는 제외하고,
    // 금액 대신 건수를 최근 30일(일별)/올해 12개월(월별)로 집계한다.
    public OrderCountStatsResponse getOrderCountStats() {
        LocalDate today = LocalDate.now(SALES_ZONE);

        Map<LocalDate, Long> dailyCounts = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            dailyCounts.put(today.minusDays(i), 0L);
        }
        long[] monthlyCounts = new long[12];

        for (OrderRevenueRow row : orderRepository.findRevenueRows()) {
            LocalDate orderDate = row.getCreatedAt().atZone(SALES_ZONE).toLocalDate();

            dailyCounts.computeIfPresent(orderDate, (date, count) -> count + 1);

            if (orderDate.getYear() == today.getYear()) {
                monthlyCounts[orderDate.getMonthValue() - 1]++;
            }
        }

        List<DailyOrderCountPoint> daily = dailyCounts.entrySet().stream()
            .map(entry -> new DailyOrderCountPoint(entry.getKey().toString(), entry.getValue()))
            .toList();

        List<MonthlyOrderCountPoint> monthly = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            monthly.add(new MonthlyOrderCountPoint(month, monthlyCounts[month - 1]));
        }

        return new OrderCountStatsResponse(daily, monthly);
    }

    // 💡 from~to(포함) 기간의 구단별/품목별 매출 집계. to는 포함이라 다음날 00시를 배타적 상한으로 쓴다.
    public SalesBreakdownResponse getSalesBreakdown(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 조회 기간입니다.");
        }

        Instant fromInstant = from.atStartOfDay(SALES_ZONE).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(SALES_ZONE).toInstant();

        Map<String, Long> teamTotals = new LinkedHashMap<>();
        Map<String, Long> categoryTotals = new LinkedHashMap<>();
        long totalRevenue = 0;

        for (OrderItemRevenueRow row : orderItemRepository.findRevenueRowsBetween(fromInstant, toInstant)) {
            long lineTotal = (long) row.getUnitPrice() * row.getQuantity();
            totalRevenue += lineTotal;

            String team = row.getTeam() != null ? row.getTeam() : "기타";
            teamTotals.merge(team, lineTotal, Long::sum);

            String category = row.getCategory() != null ? row.getCategory() : "기타";
            categoryTotals.merge(category, lineTotal, Long::sum);
        }

        return new SalesBreakdownResponse(totalRevenue, toSortedGroups(teamTotals), toSortedGroups(categoryTotals));
    }

    private List<RevenueByGroup> toSortedGroups(Map<String, Long> totals) {
        return totals.entrySet().stream()
            .map(entry -> new RevenueByGroup(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparingLong(RevenueByGroup::getRevenue).reversed())
            .toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
