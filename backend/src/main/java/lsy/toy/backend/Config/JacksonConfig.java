package lsy.toy.backend.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 💡 Spring Boot 4는 기본적으로 tools.jackson(Jackson 3) ObjectMapper만 자동 구성해서,
// 카카오페이 연동(KakaoPayService)이 쓰는 구식 com.fasterxml.jackson.databind.ObjectMapper 빈이 없다.
// jjwt-jackson이 물어오는 jackson-databind(2.x)가 클래스패스에는 있으니 빈만 직접 등록한다.
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
