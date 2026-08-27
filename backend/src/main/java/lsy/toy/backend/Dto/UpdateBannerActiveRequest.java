package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotNull;

public class UpdateBannerActiveRequest {
    @NotNull(message = "active 값이 필요합니다.")
    private Boolean active;

    public Boolean getActive() { return active; }
}
