package lsy.toy.backend.Controller;

import jakarta.servlet.http.HttpServletRequest;
import lsy.toy.backend.Dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

// 💡 컨트롤러/서비스에서 던진 예외를 한 곳에서 {timestamp,status,error,message,path} 형태로 통일해서 응답한다.
// 프론트는 이미 err.response.data.message를 읽고 있으므로(Login.tsx 등) 그 계약을 그대로 유지한다.
// RuntimeException까지만 잡는 이유: HttpRequestMethodNotSupportedException 같은 스프링 프레임워크
// 예외는 checked Exception이라 여기 걸리지 않고, 기존처럼 스프링 기본 처리(405/415 등)로 빠진다.
// 인증(401)/인가(403) 실패는 필터 체인 단계라 여기가 아니라 RestAuthenticationEntryPoint/RestAccessDeniedHandler가 담당한다.
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatusCode statusCode = ex.getStatusCode();
        String message = ex.getReason() != null ? ex.getReason() : "요청을 처리할 수 없습니다.";
        if (statusCode.is5xxServerError()) {
            log.error("요청 처리 중 서버 오류: {} - {}", request.getRequestURI(), message, ex);
        } else {
            log.warn("요청 처리 실패: {} {} - {}", request.getRequestURI(), statusCode.value(), message);
        }
        String error = (statusCode instanceof HttpStatus hs) ? hs.getReasonPhrase() : String.valueOf(statusCode.value());
        return ResponseEntity.status(statusCode)
            .body(new ErrorResponse(statusCode.value(), error, message, request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("잘못된 요청: {} - {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(toBody(HttpStatus.BAD_REQUEST, ex.getMessage(), request));
    }

    // 💡 KakaoPayService/TossPayService가 결제 요청 정보 직렬화·복원 실패 시 던지는 예외.
    // 서버 쪽 상태 문제라 500으로 응답하되, 메시지 자체는 사용자에게 보여줘도 안전한 문구다.
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        log.error("서버 상태 오류: {}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(toBody(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request));
    }

    // 💡 상품/뱃지/배너/문의 이미지 업로드는 5MB 제한(application.properties)이 걸려 있어 실제로 발생할 수 있다.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("업로드 용량 초과: {}", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(toBody(HttpStatus.BAD_REQUEST, "업로드 파일이 너무 큽니다. (최대 5MB)", request));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(RuntimeException ex, HttpServletRequest request) {
        log.error("예상하지 못한 오류: {}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(toBody(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", request));
    }

    private ErrorResponse toBody(HttpStatus status, String message, HttpServletRequest request) {
        return new ErrorResponse(status.value(), status.getReasonPhrase(), message, request.getRequestURI());
    }
}
