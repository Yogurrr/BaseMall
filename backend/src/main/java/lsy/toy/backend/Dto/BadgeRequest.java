package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

public class BadgeRequest {
    @NotBlank(message = "뱃지 이름을 입력해주세요.")
    private String name;
    @NotBlank(message = "뱃지 색상을 입력해주세요.")
    private String colorFrom;
    @NotBlank(message = "뱃지 색상을 입력해주세요.")
    private String colorTo;

    public String getName() { return name; }
    public String getColorFrom() { return colorFrom; }
    public String getColorTo() { return colorTo; }
}
