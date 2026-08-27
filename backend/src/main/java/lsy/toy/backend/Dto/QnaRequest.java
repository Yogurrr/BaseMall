package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

public class QnaRequest {
    @NotBlank(message = "질문 내용을 입력해주세요.")
    private String question;

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
}
