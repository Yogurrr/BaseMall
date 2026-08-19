package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.MyReviewResponse;
import lsy.toy.backend.Dto.ReviewableItemResponse;
import lsy.toy.backend.Service.ReviewService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class MyReviewController {

    private final ReviewService reviewService;

    public MyReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // 마이페이지 - 내가 쓴 리뷰 목록 조회 (GET, JWT 필요)
    @GetMapping("/me")
    public List<MyReviewResponse> getMyReviews(Authentication authentication) {
        return reviewService.getMyReviews(authentication.getName());
    }

    // 마이페이지 - 구매했지만 아직 리뷰를 쓰지 않은 상품 목록 (GET, JWT 필요)
    @GetMapping("/me/reviewable")
    public List<ReviewableItemResponse> getReviewableItems(Authentication authentication) {
        return reviewService.getReviewableItems(authentication.getName());
    }
}
