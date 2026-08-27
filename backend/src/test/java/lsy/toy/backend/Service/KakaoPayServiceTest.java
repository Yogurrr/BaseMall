package lsy.toy.backend.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Entity.KakaoPendingPayment;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.KakaoPendingPaymentRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// 💡 ready()/approve()의 READY 분기는 카카오페이 실서버로 실제 HTTP 요청을 보내는 callKakao()를
// 타므로 순수 유닛 테스트로는 검증하지 않는다. 여기서는 HTTP 호출 없이도 확인 가능한
// 소유권 검사와, 정합성 배치 재시도와 동일하게 "이미 승인된(APPROVED) pending을 재호출했을 때
// 카카오 API를 다시 부르지 않고 주문 생성만 재시도하는지"를 검증한다.
@ExtendWith(MockitoExtension.class)
class KakaoPayServiceTest {

    @Mock
    private KakaoPendingPaymentRepository pendingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderService orderService;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private KakaoPayService kakaoPayService;

    private User user(long id, String email) {
        User user = new User("구매자", email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private String serialize(CreateOrderRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private KakaoPendingPayment pending(long id, Long userId, int amount) {
        CreateOrderRequest request = new CreateOrderRequest();
        KakaoPendingPayment pending = new KakaoPendingPayment("tid-1", "order-1", userId, serialize(request), amount);
        ReflectionTestUtils.setField(pending, "id", id);
        return pending;
    }

    @Test
    void approve_결제요청을찾을수없으면_404를던진다() {
        when(pendingRepository.findByPartnerOrderId("order-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> kakaoPayService.approve("buyer@example.com", "order-1", "token"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void approve_본인의결제요청이아니면_403을던진다() {
        KakaoPendingPayment pending = pending(1L, 1L, 10_000);
        when(pendingRepository.findByPartnerOrderId("order-1")).thenReturn(Optional.of(pending));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(user(2L, "other@example.com")));

        assertThatThrownBy(() -> kakaoPayService.approve("other@example.com", "order-1", "token"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));

        verify(orderService, never()).createOrderFromCart(any(), any());
    }

    @Test
    void approve_이미승인된결제를재시도하면_카카오api를다시호출하지않고주문생성만재시도한다() {
        KakaoPendingPayment pending = pending(1L, 1L, 10_000);
        pending.markApproved();
        when(pendingRepository.findByPartnerOrderId("order-1")).thenReturn(Optional.of(pending));
        when(pendingRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user(1L, "buyer@example.com")));

        Order order = new Order(user(1L, "buyer@example.com"), 10_000);
        ReflectionTestUtils.setField(order, "id", 100L);
        when(orderService.createOrderFromCart(eq("buyer@example.com"), any(CreateOrderRequest.class)))
            .thenReturn(new OrderResponse(order));
        when(transactionManager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));

        OrderResponse response = kakaoPayService.approve("buyer@example.com", "order-1", "token");

        assertThat(response.getId()).isEqualTo(100L);
        verify(orderService).createOrderFromCart(eq("buyer@example.com"), any(CreateOrderRequest.class));
        verify(pendingRepository).delete(pending);
    }
}
