package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

public class KakaoLinkRequest {
    @NotBlank(message = "인가 코드가 필요합니다.")
    private String code;

    public String getCode() { return code; }
}
