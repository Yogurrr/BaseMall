package lsy.toy.backend.Controller;

import jakarta.validation.Valid;
import lsy.toy.backend.Dto.AdminQnaResponse;
import lsy.toy.backend.Dto.MyQnaResponse;
import lsy.toy.backend.Dto.QnaAnswerRequest;
import lsy.toy.backend.Service.QnaService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/qna")
public class QnaController {

    private final QnaService qnaService;

    public QnaController(QnaService qnaService) {
        this.qnaService = qnaService;
    }

    // 1. 마이페이지 "상품 Q&A 내역" 조회 (GET, JWT 필요, 본인이 작성한 질문만)
    @GetMapping("/me")
    public List<MyQnaResponse> getMyQnas(Authentication authentication) {
        return qnaService.getMyQnas(authentication.getName());
    }

    // 2. 전체 Q&A 목록 조회 (GET, 관리자 전용)
    @GetMapping
    public List<AdminQnaResponse> getAllQnas() {
        return qnaService.getAllQnas();
    }

    // 3. Q&A 답변 등록 (PATCH, 관리자 전용)
    @PatchMapping("/{id}/answer")
    public AdminQnaResponse answerQna(@PathVariable Long id, @Valid @RequestBody QnaAnswerRequest request) {
        return qnaService.answerQna(id, request.getAnswer());
    }
}
