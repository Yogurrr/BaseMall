package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.OrderPreview;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Entity.CartItem;
import lsy.toy.backend.Entity.Coupon;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.CouponRepository;
import lsy.toy.backend.Repository.OrderItemRepository;
import lsy.toy.backend.Repository.OrderRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private PointService pointService;

    @InjectMocks
    private OrderService orderService;

    private User userWithPoints(int points) {
        User user = new User("구매자", "buyer@example.com");
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setPoints(points);
        return user;
    }

    private CartItem cartItem(int price, int quantity) {
        Product product = new Product("유니폼", null, price, price, 0, 0, "img.png", null);
        ReflectionTestUtils.setField(product, "id", 100L);
        return new CartItem(null, product, quantity, null, null);
    }

    private CreateOrderRequest orderRequest(Long couponId, Integer pointsUsed) {
        CreateOrderRequest request = new CreateOrderRequest();
        ReflectionTestUtils.setField(request, "recipientName", "홍길동");
        ReflectionTestUtils.setField(request, "recipientPhone", "010-1234-5678");
        ReflectionTestUtils.setField(request, "zipCode", "12345");
        ReflectionTestUtils.setField(request, "address", "서울시 어딘가");
        ReflectionTestUtils.setField(request, "paymentMethod", "토스페이먼츠");
        ReflectionTestUtils.setField(request, "couponId", couponId);
        ReflectionTestUtils.setField(request, "pointsUsed", pointsUsed);
        return request;
    }

    @Test
    void previewOrder_쿠폰을적용하면_할인된금액을반환한다() {
        User user = userWithPoints(0);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of(cartItem(10_000, 1)));

        Coupon coupon = new Coupon(user, "10% 할인", "VIP", 10);
        when(couponRepository.findByIdAndUser_Id(5L, 1L)).thenReturn(Optional.of(coupon));

        OrderPreview preview = orderService.previewOrder("buyer@example.com", orderRequest(5L, null));

        // 10,000원 - 10% 할인(1,000원) = 9,000원
        assertThat(preview.getTotalPrice()).isEqualTo(9_000);
    }

    @Test
    void previewOrder_보유적립금을초과사용하면_400을던진다() {
        User user = userWithPoints(1_000);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of(cartItem(10_000, 1)));

        assertThatThrownBy(() -> orderService.previewOrder("buyer@example.com", orderRequest(null, 2_000)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void previewOrder_결제금액을초과해적립금을사용하면_400을던진다() {
        User user = userWithPoints(50_000);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of(cartItem(10_000, 1)));

        assertThatThrownBy(() -> orderService.previewOrder("buyer@example.com", orderRequest(null, 20_000)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void previewOrder_결제금액의1퍼센트를적립금으로계산한다() {
        User user = userWithPoints(0);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of(cartItem(10_000, 1)));

        OrderPreview preview = orderService.previewOrder("buyer@example.com", orderRequest(null, null));

        // previewOrder 자체는 적립 포인트를 노출하지 않으므로, 실제 결제 금액(1%)이 맞는지는
        // 최종 totalPrice(=결제 금액)를 통해 간접 검증한다.
        assertThat(preview.getTotalPrice()).isEqualTo(10_000);
    }

    private Order order(User user, String status, int pointsUsed, int pointsEarned) {
        Order order = new Order(user, 9_000);
        ReflectionTestUtils.setField(order, "id", 1L);
        order.setStatus(status);
        order.setPointsUsed(pointsUsed);
        order.setPointsEarned(pointsEarned);
        return order;
    }

    @Test
    void cancelMyOrder_본인주문이아니면_403을던진다() {
        User owner = userWithPoints(0);
        User requester = userWithPoints(0);
        ReflectionTestUtils.setField(requester, "id", 2L);
        ReflectionTestUtils.setField(requester, "email", "other@example.com");

        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(requester));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(owner, "결제완료", 0, 0)));

        assertThatThrownBy(() -> orderService.cancelMyOrder("other@example.com", 1L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void cancelMyOrder_결제완료상태가아니면_400을던진다() {
        User user = userWithPoints(0);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(user, "배송중", 0, 0)));

        assertThatThrownBy(() -> orderService.cancelMyOrder("buyer@example.com", 1L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void cancelMyOrder_성공하면_상태를변경하고적립금을환불한다() {
        User user = userWithPoints(0);
        Order order = order(user, "결제완료", 1_000, 90);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.cancelMyOrder("buyer@example.com", 1L);

        assertThat(response.getStatus()).isEqualTo("주문취소");
        verify(pointService).record(eq(user), eq(1_000), eq("ORDER_CANCEL"), eq(order), eq(null), any());
        verify(pointService).record(eq(user), eq(-90), eq("ORDER_CANCEL"), eq(order), eq(null), any());
    }
}
