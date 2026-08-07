package lsy.toy.backend.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // 💡 ResponseStatusException은 서블릿 컨테이너가 /error로 내부 포워드하는데,
                // 이 경로를 permitAll 해두지 않으면 시큐리티가 그 포워드 요청을 다시 막아
                // 원래 상태 코드(401/409 등)가 403으로 덮어써진다.
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/page").permitAll()
                // 💡 상품 상세는 비로그인 사용자도 봐야 하는 페이지. {id}는 숫자만 매칭해서
                // /api/products/deleted, /api/products/stats 같은 관리자용 경로는 그대로 인증이 필요하게 둔다.
                .requestMatchers(HttpMethod.GET, "/api/products/{id:[0-9]+}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                // 💡 카테고리 관리 화면(등록/수정/삭제)은 관리자 전용. id 포함 전체 목록 조회도 마찬가지.
                .requestMatchers(HttpMethod.GET, "/api/categories/admin").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAuthority("ADMIN")
                // 💡 뱃지 목록은 상품 카드가 색상을 그리기 위해 비로그인 사용자도 조회할 수 있어야 하고,
                // 등록/수정/삭제는 관리자 전용.
                .requestMatchers(HttpMethod.GET, "/api/badges").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/badges/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/badges/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/badges/**").hasAuthority("ADMIN")
                // 💡 홈 화면 광고 배너는 비로그인 사용자도 봐야 하니 공개, 관리/수정은 관리자 전용.
                .requestMatchers(HttpMethod.GET, "/api/banners").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/banners/admin").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/banners/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/banners/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/banners/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/banners/**").hasAuthority("ADMIN")
                // 💡 리뷰 목록은 구매 전 고객도 볼 수 있어야 하니 공개, 작성/수정/삭제는 로그인 필요.
                .requestMatchers(HttpMethod.GET, "/api/products/*/reviews").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/products/*/reviews").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/products/*/reviews/*").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/products/*/reviews/*").authenticated()
                // 💡 주문 전체 조회/상태 변경은 관리자 전용 기능(어드민 페이지에서만 사용).
                // 로그인만 하면 누구나 호출 가능했던 걸 막아, 다른 회원의 이름/이메일/배송지가 새는 것을 방지한다.
                .requestMatchers(HttpMethod.POST, "/api/orders").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/orders/me").authenticated()
                // 💡 카카오페이/토스페이먼츠 결제 준비/승인은 로그인한 본인만 호출 가능해야 한다 (서비스 계층에서 소유권도 다시 검증).
                .requestMatchers(HttpMethod.POST, "/api/payments/kakao/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/payments/toss/**").authenticated()
                // 💡 내 쿠폰 조회는 로그인만 하면 되지만, 등급별 일괄 발급은 관리자 전용 기능이다.
                .requestMatchers(HttpMethod.GET, "/api/coupons/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/coupons/issue").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/sales/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders").hasAuthority("ADMIN")
                // 💡 관리자 전용으로 의도된 회원 목록/통계, 주문 건수 통계 엔드포인트가
                // anyRequest().authenticated()에 걸려 로그인만 하면 누구나 호출 가능했던 걸 막는다.
                // (RLS도 동일 의도로 본인/관리자만 보이게 막지만, 그건 비관리자에게 텅 빈/자기
                // 결과만 조용히 돌려주므로, 여기서 먼저 명확한 403으로 막는 게 API 사용자에게 더 낫다)
                .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/stats", "/api/users/*").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/count-stats").hasAuthority("ADMIN")
                // 💡 특정 회원의 주문 내역 조회(회원 상세 화면)도 관리자 전용. 이게 없으면
                // anyRequest().authenticated()에 걸려 로그인한 누구나 다른 회원의 주문을 볼 수 있게 된다.
                .requestMatchers(HttpMethod.GET, "/api/orders/user/*").hasAuthority("ADMIN")
                // 💡 본인 주문 취소는 로그인한 고객이면 누구나 호출 가능해야 하니, 더 구체적인 이 규칙을
                // 아래의 관리자 전용 PATCH 규칙보다 먼저 선언한다(서비스 계층에서 소유권/상태를 다시 검증).
                .requestMatchers(HttpMethod.PATCH, "/api/orders/*/cancel").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/orders/**").hasAuthority("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
