package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

public class QnaAnswerRequest {
    @NotBlank(message = "답변 내용을 입력해주세요.")
    private String answer;

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
}
