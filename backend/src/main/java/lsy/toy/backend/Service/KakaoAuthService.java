package lsy.toy.backend.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

// 💡 카카오 "나에게 보내기" 알림용 저수준 API 클라이언트(OAuth 토큰 발급/갱신 + 메시지 발송).
// KakaoPayService와 동일하게 RestTemplate/WebClient 없이 java.net.http.HttpClient +
// ObjectMapper 수동 직렬화를 쓴다 - 이 코드베이스가 카카오 API 호출에 쓰는 기존 스타일.
@Service
public class KakaoAuthService {

    private static final Logger log = LoggerFactory.getLogger(KakaoAuthService.class);
    private static final String AUTH_BASE_URL = "https://kauth.kakao.com";
    private static final String API_BASE_URL = "https://kapi.kakao.com";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;
    private final String clientId;
    private final String frontendUrl;

    public record TokenResult(String accessToken, String refreshToken, Instant expiresAt) {}
    public record KakaoProfile(Long id, String email, String nickname) {}

    public KakaoAuthService(
        @Value("${kakao.oauth.client-id:}") String clientId,
        @Value("${app.frontend-url}") String frontendUrl,
        ObjectMapper objectMapper
    ) {
        this.clientId = clientId;
        this.frontendUrl = frontendUrl;
        this.objectMapper = objectMapper;
    }

    // 💡 프론트가 카카오 인가 서버에서 받아온 인가 코드를 최초 1회 토큰으로 교환한다. redirect_uri는
    // 인가 코드를 발급받을 때 프론트가 실제로 사용한 경로와 정확히 일치해야 한다(카카오가 검증함) -
    // 로그인(/login/kakao/callback)과 마이페이지 연동(/mypage/kakao/callback)이 서로 다른
    // 경로를 쓰므로 호출부에서 넘겨받는다.
    public TokenResult exchangeCodeForToken(String code, String redirectPath) {
        Map<String, String> form = new LinkedHashMap<>();
        form.put("grant_type", "authorization_code");
        form.put("client_id", clientId);
        form.put("redirect_uri", frontendUrl + redirectPath);
        form.put("code", code);
        return requestToken(form, "카카오 인증");
    }

    // 💡 액세스 토큰 만료 시 저장해둔 리프레시 토큰으로 갱신한다.
    public TokenResult refreshAccessToken(String refreshToken) {
        Map<String, String> form = new LinkedHashMap<>();
        form.put("grant_type", "refresh_token");
        form.put("client_id", clientId);
        form.put("refresh_token", refreshToken);
        return requestToken(form, "카카오 토큰 갱신");
    }

    private TokenResult requestToken(Map<String, String> form, String actionLabel) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(AUTH_BASE_URL + "/oauth/token"))
                .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(toFormBody(form)))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("{} 실패: status={}, body={}", actionLabel, response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, actionLabel + "에 실패했습니다.");
            }

            JsonNode body = objectMapper.readTree(response.body());
            String accessToken = body.get("access_token").asText();
            // 💡 리프레시 요청에는 refresh_token이 응답에 없을 수 있다(카카오가 갱신하지 않은 경우) - 그때는 기존 값을 유지해야 하므로 null 허용.
            String refreshToken = body.has("refresh_token") ? body.get("refresh_token").asText() : null;
            long expiresIn = body.get("expires_in").asLong();
            return new TokenResult(accessToken, refreshToken, Instant.now().plusSeconds(expiresIn));
        } catch (IOException | InterruptedException e) {
            log.error("{} 중 오류", actionLabel, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, actionLabel + " 중 오류가 발생했습니다.");
        }
    }

    // 💡 로그인한 본인의 카카오톡에 텍스트 메시지를 보낸다(talk_message 스코프 필요).
    public void sendMemoToSelf(String accessToken, String text, String linkUrl) {
        Map<String, Object> link = new LinkedHashMap<>();
        link.put("web_url", linkUrl);
        link.put("mobile_web_url", linkUrl);

        Map<String, Object> templateObject = new LinkedHashMap<>();
        templateObject.put("object_type", "text");
        templateObject.put("text", text);
        templateObject.put("link", link);

        try {
            String formBody = "template_object=" + URLEncoder.encode(
                objectMapper.writeValueAsString(templateObject), StandardCharsets.UTF_8);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/v2/api/talk/memo/default/send"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(formBody))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("카카오 나에게 보내기 실패: status={}, body={}", response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오 메시지 발송에 실패했습니다.");
            }
        } catch (IOException | InterruptedException e) {
            log.error("카카오 나에게 보내기 중 오류", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오 메시지 발송 중 오류가 발생했습니다.");
        }
    }

    // 💡 카카오 로그인(회원가입 겸용)에 쓸 최소한의 프로필 정보. account_email 동의가 없으면
    // email이 null로 오는데, 이 서비스는 이메일을 계정 식별자로 쓰는 구조라 호출부(AuthService)에서
    // null이면 로그인을 거부한다.
    public KakaoProfile getUserInfo(String accessToken) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/v2/user/me"))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("카카오 사용자 정보 조회 실패: status={}, body={}", response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오 사용자 정보 조회에 실패했습니다.");
            }

            JsonNode body = objectMapper.readTree(response.body());
            long id = body.get("id").asLong();
            JsonNode account = body.get("kakao_account");
            String email = account != null && account.hasNonNull("email") ? account.get("email").asText() : null;
            String nickname = account != null && account.path("profile").hasNonNull("nickname")
                ? account.get("profile").get("nickname").asText()
                : "카카오 사용자";
            return new KakaoProfile(id, email, nickname);
        } catch (IOException | InterruptedException e) {
            log.error("카카오 사용자 정보 조회 중 오류", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오 사용자 정보 조회 중 오류가 발생했습니다.");
        }
    }

    private String toFormBody(Map<String, String> form) {
        return form.entrySet().stream()
            .map(entry -> entry.getKey() + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
            .collect(Collectors.joining("&"));
    }
}
