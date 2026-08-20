package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AuthResponse;
import lsy.toy.backend.Dto.RegisterRequest;
import lsy.toy.backend.Dto.UpdateProfileRequest;
import lsy.toy.backend.Dto.UserInfoResponse;
import lsy.toy.backend.Entity.Team;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.TeamRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthService(
        UserRepository userRepository,
        CartItemRepository cartItemRepository,
        TeamRepository teamRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        UserService userService
    ) {
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userService = userService;
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

    public AuthResponse login(String email, String rawPassword) {
        // 💡 로그인 시점엔 아직 인증된 사용자가 없어 일반 findByEmail(RLS 적용 대상)로는
        // users를 조회할 수 없으므로 인증 우회용 조회 경로를 쓴다.
        // 탈퇴한 계정(use_at='N')은 로그인 계정 자체가 없는 것처럼 동일한 에러로 막는다
        // (탈퇴 여부를 노출하지 않기 위해 실패 메시지는 일반 로그인 실패와 동일하게 유지).
        User user = userRepository.findAuthCredentialsByEmail(email)
            .filter(u -> "Y".equals(u.getUseAt()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtService.generateToken(user.getEmail());

        if ("ADMIN".equals(user.getRole())) {
            log.info("관리자 로그인: userId={}, email={}", user.getId(), user.getEmail());
        } else {
            log.info("회원 로그인: userId={}, email={}", user.getId(), user.getEmail());
        }

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
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

        String newName = request.getName();
        if (newName == null || newName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름을 입력해주세요.");
        }
        user.setName(newName.trim());

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
            user.getRole(), favoriteTeamName, grade, user.getPoints());
    }

    // 💡 회원 탈퇴. 비밀번호 재확인 후 장바구니를 먼저 비우고, 계정은 실제로 지우지 않고
    // use_at='N' 소프트 삭제로 전환한다 (주문/위시리스트에 FK로 남아있는 회원은 하드 삭제 시
    // 제약 위반으로 실패했던 문제도 함께 해결됨. Product.deleteProduct와 동일한 패턴).
    public void deleteAccount(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다.");
        }

        cartItemRepository.deleteByUser_Id(user.getId());
        user.withdraw();
        userRepository.save(user);
    }
}
