package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.ReviewRequest;
import lsy.toy.backend.Dto.ReviewResponse;
import lsy.toy.backend.Service.ReviewService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // 1. 상품 리뷰 목록 조회 (GET, 로그인 불필요)
    @GetMapping
    public List<ReviewResponse> getReviews(@PathVariable Long productId) {
        return reviewService.getReviews(productId);
    }

    // 2. 리뷰 작성 (POST, JWT 필요, 상품당 1인 1리뷰)
    @PostMapping
    public ReviewResponse createReview(
        @PathVariable Long productId,
        Authentication authentication,
        @RequestBody ReviewRequest request
    ) {
        return reviewService.createReview(productId, authentication.getName(), request.getRating(), request.getContent());
    }

    // 3. 내 리뷰 수정 (PUT, JWT 필요, 작성자 본인만)
    @PutMapping("/{reviewId}")
    public ReviewResponse updateReview(
        @PathVariable Long productId,
        @PathVariable Long reviewId,
        Authentication authentication,
        @RequestBody ReviewRequest request
    ) {
        return reviewService.updateReview(productId, reviewId, authentication.getName(), request.getRating(), request.getContent());
    }

    // 4. 리뷰 삭제 (DELETE, JWT 필요, 작성자 본인 또는 관리자)
    @DeleteMapping("/{reviewId}")
    public void deleteReview(
        @PathVariable Long productId,
        @PathVariable Long reviewId,
        Authentication authentication
    ) {
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ADMIN"));
        reviewService.deleteReview(productId, reviewId, authentication.getName(), isAdmin);
    }
}
