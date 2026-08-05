package lsy.toy.backend.Security;

import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 💡 이 조회는 인증(SecurityContext) 성립 "이전"에 매 요청마다 일어나므로
        // users의 RLS 정책(본인 또는 관리자만)을 통과할 수 없다. 이메일 완전 일치 조회만
        // 허용하는 SECURITY DEFINER 함수(app_auth_lookup_user) 경유 메서드를 사용한다.
        User user = userRepository.findAuthCredentialsByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        return new AppUserPrincipal(
            user.getId(),
            user.getEmail(),
            user.getPassword() != null ? user.getPassword() : "",
            user.getRole() != null ? user.getRole() : "USER"
        );
    }
}
