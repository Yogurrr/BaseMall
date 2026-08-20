package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.QnaRequest;
import lsy.toy.backend.Dto.QnaResponse;
import lsy.toy.backend.Service.QnaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/qna")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class ProductQnaController {

    private final QnaService qnaService;

    public ProductQnaController(QnaService qnaService) {
        this.qnaService = qnaService;
    }

    // 1. 상품 Q&A 목록 조회 (GET, 로그인 불필요)
    @GetMapping
    public List<QnaResponse> getQnas(@PathVariable Long productId) {
        return qnaService.getQnas(productId);
    }

    // 2. 질문 작성 (POST, JWT 필요, 구매 여부와 무관하게 누구나 질문 가능)
    @PostMapping
    public ResponseEntity<QnaResponse> createQna(
        @PathVariable Long productId,
        Authentication authentication,
        @RequestBody QnaRequest request
    ) {
        QnaResponse created = qnaService.createQna(productId, authentication.getName(), request.getQuestion());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 3. 질문 삭제 (DELETE, 작성자 본인(답변 전만) 또는 관리자)
    @DeleteMapping("/{qnaId}")
    public ResponseEntity<Void> deleteQna(
        @PathVariable Long productId,
        @PathVariable Long qnaId,
        Authentication authentication
    ) {
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ADMIN"));
        qnaService.deleteQna(productId, qnaId, authentication.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
