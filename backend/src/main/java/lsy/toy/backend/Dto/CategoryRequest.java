package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryRequest {
    @NotBlank(message = "카테고리 이름을 입력해주세요.")
    private String name;

    public String getName() { return name; }
}
