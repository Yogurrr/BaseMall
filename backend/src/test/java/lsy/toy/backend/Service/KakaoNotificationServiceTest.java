package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KakaoNotificationServiceTest {

    @Mock
    private KakaoAuthService kakaoAuthService;
    @Mock
    private UserRepository userRepository;

    private KakaoNotificationService kakaoNotificationService;

    @BeforeEach
    void setUp() {
        kakaoNotificationService = new KakaoNotificationService(
            kakaoAuthService, userRepository, "http://localhost:5173");
    }

    private User user(long id) {
        User user = new User("회원", "user@example.com");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Order order(long id, User user) {
        Order order = new Order(user, 10000);
        ReflectionTestUtils.setField(order, "id", id);
        return order;
    }

    @Test
    void notifyOrderStatusChanged_카카오연동안된회원이면_메시지를보내지않는다() {
        User user = user(1L);
        Order order = order(1L, user);

        kakaoNotificationService.notifyOrderStatusChanged(order);

        verify(kakaoAuthService, never()).sendMemoToSelf(any(), any(), any());
    }

    @Test
    void notifyOrderStatusChanged_토큰이유효하면_갱신없이바로발송한다() {
        User user = user(1L);
        user.setKakaoAccessToken("valid-token");
        user.setKakaoTokenExpiresAt(Instant.now().plusSeconds(3600));
        Order order = order(1L, user);
        order.setStatus("배송중");

        kakaoNotificationService.notifyOrderStatusChanged(order);

        verify(kakaoAuthService, never()).refreshAccessToken(any());
        verify(kakaoAuthService).sendMemoToSelf(
            eq("valid-token"), eq("[구단상점] 주문 #1 상태가 배송중(으)로 변경되었습니다."), eq("http://localhost:5173/mypage/orders"));
    }

    @Test
    void notifyOrderStatusChanged_토큰이만료되었으면_갱신후발송하고회원정보를저장한다() {
        User user = user(1L);
        user.setKakaoAccessToken("old-token");
        user.setKakaoRefreshToken("refresh-token");
        user.setKakaoTokenExpiresAt(Instant.now().minusSeconds(10));
        Order order = order(1L, user);

        KakaoAuthService.TokenResult refreshed = new KakaoAuthService.TokenResult(
            "new-token", "new-refresh-token", Instant.now().plusSeconds(3600));
        when(kakaoAuthService.refreshAccessToken("refresh-token")).thenReturn(refreshed);

        kakaoNotificationService.notifyOrderStatusChanged(order);

        assertThat(user.getKakaoAccessToken()).isEqualTo("new-token");
        assertThat(user.getKakaoRefreshToken()).isEqualTo("new-refresh-token");
        verify(userRepository).save(user);
        verify(kakaoAuthService).sendMemoToSelf(eq("new-token"), anyString(), anyString());
    }

    @Test
    void notifyOrderStatusChanged_갱신응답에refreshToken이없으면_기존값을유지한다() {
        User user = user(1L);
        user.setKakaoAccessToken("old-token");
        user.setKakaoRefreshToken("refresh-token");
        user.setKakaoTokenExpiresAt(Instant.now().minusSeconds(10));
        Order order = order(1L, user);

        KakaoAuthService.TokenResult refreshed = new KakaoAuthService.TokenResult(
            "new-token", null, Instant.now().plusSeconds(3600));
        when(kakaoAuthService.refreshAccessToken("refresh-token")).thenReturn(refreshed);

        kakaoNotificationService.notifyOrderStatusChanged(order);

        assertThat(user.getKakaoRefreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void notifyOrderStatusChanged_발송중예외가나도_밖으로전파하지않는다() {
        User user = user(1L);
        user.setKakaoAccessToken("valid-token");
        user.setKakaoTokenExpiresAt(Instant.now().plusSeconds(3600));
        Order order = order(1L, user);
        doThrow(new RuntimeException("카카오 API 오류")).when(kakaoAuthService).sendMemoToSelf(any(), any(), any());

        kakaoNotificationService.notifyOrderStatusChanged(order);
    }

    @Test
    void notifyTrackingNumberRegistered_운송장번호가없으면_회원조회없이바로리턴한다() {
        User user = user(1L);
        user.setKakaoAccessToken("valid-token");
        Order order = order(1L, user);

        kakaoNotificationService.notifyTrackingNumberRegistered(order);

        verify(kakaoAuthService, never()).sendMemoToSelf(any(), any(), any());
    }

    @Test
    void notifyTrackingNumberRegistered_운송장번호가있으면_알림을보낸다() {
        User user = user(1L);
        user.setKakaoAccessToken("valid-token");
        user.setKakaoTokenExpiresAt(Instant.now().plusSeconds(3600));
        Order order = order(1L, user);
        order.setTrackingNumber("1234567890");

        kakaoNotificationService.notifyTrackingNumberRegistered(order);

        verify(kakaoAuthService).sendMemoToSelf(
            eq("valid-token"), eq("[구단상점] 주문 #1의 운송장 번호가 등록되었습니다: 1234567890"), anyString());
    }
}
