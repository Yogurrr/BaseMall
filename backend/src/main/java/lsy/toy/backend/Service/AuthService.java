package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AuthResponse;
import lsy.toy.backend.Dto.RegisterRequest;
import lsy.toy.backend.Dto.UpdateProfileRequest;
import lsy.toy.backend.Dto.UserInfoResponse;
import lsy.toy.backend.Entity.Team;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.RefreshTokenRepository;
import lsy.toy.backend.Repository.TeamRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // 💡 8자 이상 + 영문/숫자/특수문자 중 2가지 이상 조합, 그 외 문자(한글/공백 등)는 아예 허용하지 않는다.
    // (?=.{8,}) 로 길이를 먼저 확인하고, 뒤의 비-캡처 그룹에서 두 카테고리 조합 중 하나라도 만족하는지 본다.
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.{8,})(?:(?=.*[A-Za-z])(?=.*\\d)|(?=.*[A-Za-z])(?=.*[!@#$%^&*()_+=-])|(?=.*\\d)(?=.*[!@#$%^&*()_+=-]))"
            + "[A-Za-z\\d!@#$%^&*()_+=-]+$"
    );
    private static final String PASSWORD_RULE_MESSAGE =
        "비밀번호는 8자 이상이며 영문/숫자/특수문자 중 2가지 이상을 조합해야 합니다.";

    // 💡 휴대폰번호는 010-1234-5678처럼 하이픈으로 구분된 형식만 허용한다.
    private static final Pattern PHONE_PATTERN = Pattern.compile("^01[016789]-\\d{3,4}-\\d{4}$");
    private static final String PHONE_RULE_MESSAGE = "휴대폰번호는 010-1234-5678 형식으로 입력해주세요.";

    // 💡 브루트포스 방지: 계정당 연속 5회 실패하면 15분간 로그인을 막는다(비밀번호가 맞아도).
    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final Duration LOGIN_LOCKOUT_DURATION = Duration.ofMinutes(15);

    // 💡 카카오 인가 코드를 발급받을 때 프론트가 실제로 쓰는 리다이렉트 경로. 마이페이지 계정 연동과
    // 로그인은 별개 화면(인증 여부가 다름)이라 서로 다른 콜백 경로를 쓴다 - App.tsx 라우트와 맞춰야 한다.
    private static final String KAKAO_LINK_REDIRECT_PATH = "/mypage/kakao/callback";
    private static final String KAKAO_LOGIN_REDIRECT_PATH = "/login/kakao/callback";

    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;
    private final KakaoAuthService kakaoAuthService;

    public AuthService(
        UserRepository userRepository,
        CartItemRepository cartItemRepository,
        RefreshTokenRepository refreshTokenRepository,
        TeamRepository teamRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        UserService userService,
        KakaoAuthService kakaoAuthService
    ) {
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userService = userService;
        this.kakaoAuthService = kakaoAuthService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail();
        // 💡 아직 로그인하지 않은 상태(RLS 세션에 본인 식별자가 없음)라 일반 findByEmail로는
        // users를 조회할 수 없다 — 이메일 중복 확인은 인증 우회용 조회 경로를 사용한다.
        if (userRepository.findAuthCredentialsByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다: " + email);
        }

        String rawPassword = request.getPassword();
        if (rawPassword == null || !PASSWORD_PATTERN.matcher(rawPassword).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_RULE_MESSAGE);
        }

        User user = new User(request.getName(), email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setBirthDate(request.getBirthDate());
        user.setPhoneNumber(normalizePhoneNumber(request.getPhoneNumber()));
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getEmail());
        return new AuthResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole());
    }

    // 💡 noRollbackFor 필수: 로그인 실패 시 아래서 ResponseStatusException(401/429)을 던지는데,
    // @Transactional 기본 규칙은 RuntimeException에서 트랜잭션을 롤백한다. 그렇게 두면 방금
    // registerLoginFailure로 기록한 실패 횟수 UPDATE까지 함께 취소되어 잠금이 걸리지 않는다.
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AuthResponse login(String email, String rawPassword) {
        // 💡 로그인 시점엔 아직 인증된 사용자가 없어 일반 findByEmail(RLS 적용 대상)로는
        // users를 조회할 수 없으므로 인증 우회용 조회 경로를 쓴다.
        // 탈퇴한 계정(use_at='N')은 로그인 계정 자체가 없는 것처럼 동일한 에러로 막는다
        // (탈퇴 여부를 노출하지 않기 위해 실패 메시지는 일반 로그인 실패와 동일하게 유지).
        User user = userRepository.findAuthCredentialsByEmail(email)
            .filter(u -> "Y".equals(u.getUseAt()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

        Instant now = Instant.now();
        // 💡 잠금이 살아있으면 비밀번호가 맞아도 거부한다 — 유출/추측된 비밀번호로 짧게 몰아치는 시도까지 막기 위함.
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "로그인 시도가 너무 많아 계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.");
        }

        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            registerLoginFailure(user, now);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 💡 실패 이력이 있었다면(잠금까지는 안 갔더라도) 로그인에 성공했으니 리셋해준다.
        if (user.getFailedLoginAttempts() > 0 || user.getLockedUntil() != null) {
            userRepository.updateLoginAttemptState(email, 0, null);
        }

        String token = jwtService.generateToken(user.getEmail());

        if ("ADMIN".equals(user.getRole())) {
            log.info("관리자 로그인: userId={}, email={}", user.getId(), user.getEmail());
        } else {
            log.info("회원 로그인: userId={}, email={}", user.getId(), user.getEmail());
        }

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    // 💡 증가("이전 값 읽기 → +1 → 절대값 쓰기")와 잠금 만료 후 리셋 판정을 모두 DB 함수
    // (app_auth_register_login_failure, V34) 안의 단일 UPDATE 문으로 위임한다. 동시에 같은
    // 계정으로 실패가 두 번 들어와도 Postgres가 같은 row에 대한 UPDATE를 직렬화해주므로,
    // 여기서 user 스냅샷 값을 읽어 계산하던 예전 방식과 달리 lost update가 발생하지 않는다.
    private void registerLoginFailure(User user, Instant now) {
        userRepository.registerLoginFailure(
            user.getEmail(), now, MAX_FAILED_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_DURATION.getSeconds());
    }

    public UserInfoResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        return toResponse(user);
    }

    // 💡 team이 비어있으면 응원팀 선택을 해제(null)한다.
    public UserInfoResponse updateFavoriteTeam(String email, String teamName) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        if (teamName == null || teamName.isBlank()) {
            user.setFavoriteTeam(null);
        } else {
            Team team = teamRepository.findByName(teamName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 구단입니다: " + teamName));
            user.setFavoriteTeam(team);
        }

        return toResponse(userRepository.save(user));
    }

    // 💡 이름/생년월일/휴대폰번호/비밀번호를 각각 선택적으로 바꾼다. 이메일은 로그인 식별자(JWT subject)라
    // 여기서 수정할 수 없게 막아둔다 — 바꾸려면 별도의 재인증 플로우가 필요해서 범위 밖.
    public UserInfoResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        user.setName(request.getName().trim());

        user.setBirthDate(request.getBirthDate());

        user.setPhoneNumber(normalizePhoneNumber(request.getPhoneNumber()));

        String newPassword = request.getNewPassword();
        if (newPassword != null && !newPassword.isBlank()) {
            if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_RULE_MESSAGE);
            }
            String currentPassword = request.getCurrentPassword();
            if (currentPassword == null || user.getPassword() == null
                || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "현재 비밀번호가 올바르지 않습니다.");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return toResponse(userRepository.save(user));
    }

    // 💡 register/updateProfile 둘 다 휴대폰번호를 선택 입력으로 받아 같은 규칙으로 검증하므로 공통 헬퍼로 뺐다.
    private String normalizePhoneNumber(String rawPhoneNumber) {
        if (rawPhoneNumber == null || rawPhoneNumber.isBlank()) {
            return null;
        }
        String trimmed = rawPhoneNumber.trim();
        if (!PHONE_PATTERN.matcher(trimmed).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PHONE_RULE_MESSAGE);
        }
        return trimmed;
    }

    private UserInfoResponse toResponse(User user) {
        String favoriteTeamName = user.getFavoriteTeam() != null ? user.getFavoriteTeam().getName() : null;
        // 💡 ADMIN은 고객이 아니라 운영자라 구매 등급 개념이 없으므로 null로 둔다.
        String grade = "ADMIN".equals(user.getRole()) ? null : userService.getMemberGrade(user.getId());
        return new UserInfoResponse(user.getId(), user.getName(), user.getEmail(), user.getBirthDate(), user.getPhoneNumber(),
            user.getRole(), favoriteTeamName, grade, user.getPoints(), user.getKakaoAccessToken() != null);
    }

    // 💡 마이페이지에서 카카오 계정을 연동한다. 로그인 자체를 카카오로 대체하는 게 아니라, talk_message
    // 동의로 받은 토큰을 저장해뒀다가 주문 알림(KakaoNotificationService)에만 쓴다.
    public UserInfoResponse linkKakaoAccount(String email, String code) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        KakaoAuthService.TokenResult token = kakaoAuthService.exchangeCodeForToken(code, KAKAO_LINK_REDIRECT_PATH);
        user.setKakaoAccessToken(token.accessToken());
        user.setKakaoRefreshToken(token.refreshToken());
        user.setKakaoTokenExpiresAt(token.expiresAt());

        return toResponse(userRepository.save(user));
    }

    public UserInfoResponse unlinkKakaoAccount(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        user.unlinkKakao();

        return toResponse(userRepository.save(user));
    }

    // 💡 카카오 로그인(=로그인 화면의 "카카오로 시작하기"). 이메일로 기존 계정을 찾아 매칭하고
    // (로컬 계정이든 이전에 카카오로 만든 계정이든) 없으면 새로 회원가입시킨다 - 로그인 자체를
    // 이메일/비밀번호와 별개의 두 번째 수단으로 제공하는 것이라, 여기서 만든 계정도 password는
    // null로 남아 일반 로그인(login())으로는 접근할 수 없다.
    // 💡 아직 인증 전이라 findByEmail(RLS 적용)이 아니라 findAuthCredentialsByEmail을 쓴다 -
    // register()/login()과 동일한 이유.
    public AuthResponse loginWithKakao(String code) {
        KakaoAuthService.TokenResult token = kakaoAuthService.exchangeCodeForToken(code, KAKAO_LOGIN_REDIRECT_PATH);
        KakaoAuthService.KakaoProfile profile = kakaoAuthService.getUserInfo(token.accessToken());

        if (profile.email() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "카카오 계정의 이메일 제공에 동의해야 로그인할 수 있습니다.");
        }

        Optional<User> existing = userRepository.findAuthCredentialsByEmail(profile.email());
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (!"Y".equals(user.getUseAt())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "탈퇴한 계정입니다.");
            }
            userRepository.linkKakaoAccountBypass(
                profile.email(), profile.id(), token.accessToken(), token.refreshToken(), token.expiresAt());
            log.info("카카오 로그인: userId={}, email={}", user.getId(), user.getEmail());
        } else {
            User created = new User(profile.nickname(), profile.email());
            created.setKakaoId(profile.id());
            created.setKakaoAccessToken(token.accessToken());
            created.setKakaoRefreshToken(token.refreshToken());
            created.setKakaoTokenExpiresAt(token.expiresAt());
            user = userRepository.save(created);
            log.info("카카오 신규 회원가입: userId={}, email={}", user.getId(), user.getEmail());
        }

        String jwt = jwtService.generateToken(user.getEmail());
        return new AuthResponse(jwt, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    // 💡 회원 탈퇴. 비밀번호 재확인 후 장바구니를 먼저 비우고, 계정은 실제로 지우지 않고
    // use_at='N' 소프트 삭제로 전환한다 (주문/위시리스트에 FK로 남아있는 회원은 하드 삭제 시
    // 제약 위반으로 실패했던 문제도 함께 해결됨. Product.deleteProduct와 동일한 패턴).
    // 💡 deleteByUser_Id 같은 파생 삭제 쿼리는 대상 행이 있으면 EntityManager.remove()를 호출하는데,
    // 이게 활성 트랜잭션 없이 호출되면 TransactionRequiredException이 난다. @Transactional로 감싼다.
    @Transactional
    public void deleteAccount(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다.");
        }

        cartItemRepository.deleteByUser_Id(user.getId());
        // 💡 탈퇴 후에도 유효한 리프레시 토큰이 남아있으면 httpOnly 쿠키만으로 조용히 재로그인될 수 있다.
        refreshTokenRepository.deleteByUser_Id(user.getId());
        user.withdraw();
        userRepository.save(user);
    }
}
