package lsy.toy.backend.Security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// 💡 RlsAwareDataSource는 커넥션을 꺼낼 때마다 SecurityContextHolder(스레드로컬)에서
// 로그인 사용자를 읽어 RLS 세션 변수를 채운다. @Scheduled 배치는 HTTP 요청 스레드가 아니라
// 이 컨텍스트가 비어 있어 그대로 두면 모든 테이블의 소유자/관리자 RLS 정책에 막힌다.
// 배치가 실행되는 동안만 ADMIN 권한의 시스템 인증을 채워 넣었다가 끝나면 원래대로 되돌린다.
public final class SystemAuthentication {

    // 💡 id는 실제로 존재하는 사용자를 가리키지 않지만, RlsAwareDataSource가
    // String.valueOf(id)를 그대로 app.user_id 세션 변수에 넣고 bigint로 캐스팅하므로
    // null이면 "null" 문자열 캐스팅 에러가 난다. ADMIN 권한이라 소유자 검사는 어차피 우회되므로
    // 값 자체는 의미 없이 0으로 둔다.
    private static final AppUserPrincipal SYSTEM_PRINCIPAL =
        new AppUserPrincipal(0L, "system@internal", null, "ADMIN");

    private SystemAuthentication() {
    }

    public static void runAsAdmin(Runnable action) {
        runAs(SYSTEM_PRINCIPAL, action);
    }

    // 💡 리프레시 토큰 로테이션처럼 "방금 신원을 확인했지만 아직 SecurityContext는 없는" 특정 유저로
    // 짧게 인증을 흉내내야 할 때 쓴다. runAsAdmin과 동일한 try/finally 패턴이지만 고정 ADMIN이 아니라
    // 임의의 principal을 받는다.
    public static void runAs(AppUserPrincipal principal, Runnable action) {
        Authentication previous = SecurityContextHolder.getContext().getAuthentication();
        Authentication authentication =
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            action.run();
        } finally {
            SecurityContextHolder.getContext().setAuthentication(previous);
        }
    }
}
