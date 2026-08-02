package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Entity.CartItem;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.OrderItem;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.OrderRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class OrderService {

    // 💡 관리자 페이지의 주문 상태 셀렉트에서 그대로 쓸 수 있도록 표시용 한글 문자열을 그대로 저장한다.
    private static final Set<String> VALID_STATUSES =
        Set.of("결제완료", "배송준비중", "배송중", "배송완료", "주문취소");

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    public OrderService(
        OrderRepository orderRepository,
        CartItemRepository cartItemRepository,
        UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse createOrderFromCart(String email, String shippingAddress) {
        if (shippingAddress == null || shippingAddress.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "배송지를 입력해주세요.");
        }

        User user = findUser(email);
        List<CartItem> cartItems = cartItemRepository.findByUser_IdOrderByIdAsc(user.getId());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장바구니가 비어 있습니다.");
        }

        int totalPrice = cartItems.stream()
            .mapToInt(item -> item.getProduct().getPrice() * item.getQuantity())
            .sum();

        Order order = new Order(user, totalPrice);
        order.setShippingAddress(shippingAddress.trim());
        for (CartItem cartItem : cartItems) {
            order.addItem(new OrderItem(
                cartItem.getProduct().getName(),
                cartItem.getProduct().getCategoryName(),
                cartItem.getProduct().getEmoji(),
                cartItem.getProduct().getPrice(),
                cartItem.getQuantity()
            ));
            // 💡 인기순/판매순 정렬이 참조하는 누적 판매 수량. 같은 트랜잭션이라 별도 save 없이 커밋 시 반영된다.
            cartItem.getProduct().incrementSoldCount(cartItem.getQuantity());
        }

        Order saved = orderRepository.save(order);
        cartItemRepository.deleteByUser_Id(user.getId());

        return new OrderResponse(saved);
    }

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

    public OrderResponse updateStatus(Long orderId, String status) {
        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 주문 상태입니다: " + status);
        }

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다: " + orderId));

        order.setStatus(status);
        return new OrderResponse(orderRepository.save(order));
    }

    public OrderResponse updateTrackingNumber(Long orderId, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다: " + orderId));

        order.setTrackingNumber(trackingNumber == null || trackingNumber.isBlank() ? null : trackingNumber.trim());
        return new OrderResponse(orderRepository.save(order));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }
}
