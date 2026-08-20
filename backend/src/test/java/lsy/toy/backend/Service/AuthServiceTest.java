package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AuthResponse;
import lsy.toy.backend.Dto.RegisterRequest;
import lsy.toy.backend.Dto.UpdateProfileRequest;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.TeamRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserService userService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest(String email, String password) {
        RegisterRequest request = new RegisterRequest();
        ReflectionTestUtils.setField(request, "name", "김선수");
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        return request;
    }

    private User existingUser(String email, String rawPassword, String encodedPassword, String useAt) {
        User user = new User("이선수", email);
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setPassword(encodedPassword);
        ReflectionTestUtils.setField(user, "useAt", useAt);
        return user;
    }

    @Test
    void register_이미가입된이메일이면_409를던진다() {
        when(userRepository.findAuthCredentialsByEmail("dup@example.com"))
            .thenReturn(Optional.of(existingUser("dup@example.com", "pw", "encoded", "Y")));

        assertThatThrownBy(() -> authService.register(registerRequest("dup@example.com", "Abcd1234")))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
    }

    @Test
    void register_비밀번호규칙에안맞으면_400을던진다() {
        when(userRepository.findAuthCredentialsByEmail("new@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(registerRequest("new@example.com", "abc")))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void register_성공하면_토큰과사용자정보를반환한다() {
        when(userRepository.findAuthCredentialsByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Abcd1234")).thenReturn("encoded-pw");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 10L);
            return saved;
        });
        when(jwtService.generateToken("new@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest("new@example.com", "Abcd1234"));

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getEmail()).isEqualTo("new@example.com");
    }

    @Test
    void login_존재하지않는이메일이면_401을던진다() {
        when(userRepository.findAuthCredentialsByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("ghost@example.com", "Abcd1234"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void login_탈퇴한계정이면_401을던진다() {
        when(userRepository.findAuthCredentialsByEmail("withdrawn@example.com"))
            .thenReturn(Optional.of(existingUser("withdrawn@example.com", "Abcd1234", "encoded", "N")));

        assertThatThrownBy(() -> authService.login("withdrawn@example.com", "Abcd1234"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void login_비밀번호가틀리면_401을던진다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("user@example.com", "wrong"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void login_성공하면_토큰을반환한다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Abcd1234", "encoded")).thenReturn(true);
        when(jwtService.generateToken("user@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.login("user@example.com", "Abcd1234");

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void updateProfile_현재비밀번호가틀리면_401을던진다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-current", "encoded")).thenReturn(false);

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "name", "이선수");
        ReflectionTestUtils.setField(request, "currentPassword", "wrong-current");
        ReflectionTestUtils.setField(request, "newPassword", "Newpass12");

        assertThatThrownBy(() -> authService.updateProfile("user@example.com", request))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void deleteAccount_비밀번호가틀리면_401을던진다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.deleteAccount("user@example.com", "wrong"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));

        verify(cartItemRepository, never()).deleteByUser_Id(any());
    }

    @Test
    void deleteAccount_성공하면_소프트삭제하고장바구니를비운다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Abcd1234", "encoded")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.deleteAccount("user@example.com", "Abcd1234");

        verify(cartItemRepository).deleteByUser_Id(1L);
        assertThat(user.getUseAt()).isEqualTo("N");
    }
}
