package lsy.toy.backend.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ReviewRequest {
    @Min(value = 1, message = "별점은 1~5 사이여야 합니다.")
    @Max(value = 5, message = "별점은 1~5 사이여야 합니다.")
    private int rating;
    @NotBlank(message = "리뷰 내용을 입력해주세요.")
    private String content;

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
