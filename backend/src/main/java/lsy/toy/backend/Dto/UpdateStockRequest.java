package lsy.toy.backend.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateStockRequest {
    @NotNull(message = "재고는 0 이상이어야 합니다.")
    @Min(value = 0, message = "재고는 0 이상이어야 합니다.")
    private Integer stock;

    public Integer getStock() { return stock; }
}
