package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

// 💡 주문 상태 변경/운송장 등록 시 카카오 계정을 연동해둔 회원에게 "나에게 보내기"로 알림을 보낸다.
// 알림 발송은 부가 기능이라 실패해도 주문 처리(OrderService)의 트랜잭션에 영향을 주면 안 되므로,
// 모든 예외를 여기서 삼키고 로그만 남긴다(KakaoPayService.reconcileStuckPayments와 같은 best-effort 철학).
@Service
public class KakaoNotificationService {

    private static final Logger log = LoggerFactory.getLogger(KakaoNotificationService.class);

    private final KakaoAuthService kakaoAuthService;
    private final UserRepository userRepository;
    private final String frontendUrl;

    public KakaoNotificationService(
        KakaoAuthService kakaoAuthService,
        UserRepository userRepository,
        @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.kakaoAuthService = kakaoAuthService;
        this.userRepository = userRepository;
        this.frontendUrl = frontendUrl;
    }

    public void notifyOrderStatusChanged(Order order) {
        notify(order, "[구단상점] 주문 #" + order.getId() + " 상태가 " + order.getStatus() + "(으)로 변경되었습니다.");
    }

    public void notifyTrackingNumberRegistered(Order order) {
        if (order.getTrackingNumber() == null) {
            return;
        }
        notify(order, "[구단상점] 주문 #" + order.getId() + "의 운송장 번호가 등록되었습니다: " + order.getTrackingNumber());
    }

    private void notify(Order order, String text) {
        try {
            User user = order.getUser();
            if (user.getKakaoAccessToken() == null) {
                return;
            }

            String accessToken = ensureFreshToken(user);
            kakaoAuthService.sendMemoToSelf(accessToken, text, frontendUrl + "/mypage/orders");
        } catch (Exception e) {
            log.warn("카카오 주문 알림 발송 실패: orderId={}", order.getId(), e);
        }
    }

    private String ensureFreshToken(User user) {
        if (user.getKakaoTokenExpiresAt() != null && user.getKakaoTokenExpiresAt().isAfter(Instant.now())) {
            return user.getKakaoAccessToken();
        }

        KakaoAuthService.TokenResult refreshed = kakaoAuthService.refreshAccessToken(user.getKakaoRefreshToken());
        user.setKakaoAccessToken(refreshed.accessToken());
        if (refreshed.refreshToken() != null) {
            user.setKakaoRefreshToken(refreshed.refreshToken());
        }
        user.setKakaoTokenExpiresAt(refreshed.expiresAt());
        userRepository.save(user);
        return refreshed.accessToken();
    }
}
