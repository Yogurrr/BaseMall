package lsy.toy.backend.Config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 💡 이 프로젝트는 JWT를 Authorization: Bearer <token> 헤더로 싣는 방식이라, Swagger UI 우측 상단의
// Authorize 버튼에 토큰만 넣으면 보호된 API도 바로 테스트할 수 있도록 bearer 스킴을 등록해둔다.
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI backendOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("KBO 굿즈 쇼핑몰 API")
                .description("Spring Boot 백엔드 API 문서")
                .version("v1"))
            .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
            .components(new Components()
                .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                    .name(BEARER_SCHEME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }
}
