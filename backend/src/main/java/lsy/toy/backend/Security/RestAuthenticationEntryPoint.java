package lsy.toy.backend.Security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lsy.toy.backend.Dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

// 💡 로그인이 필요한 요청에 토큰이 없거나 무효할 때 호출된다. 컨테이너 기본 처리(빈 본문 403) 대신
// GlobalExceptionHandler와 동일한 {timestamp,status,error,message,path} 형태로 응답을 맞춘다.
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ErrorResponse body = new ErrorResponse(status.value(), status.getReasonPhrase(), "로그인이 필요합니다.", request.getRequestURI());
        objectMapper.writeValue(response.getWriter(), body);
    }
}
