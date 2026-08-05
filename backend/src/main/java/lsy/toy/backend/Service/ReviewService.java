package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.ReviewResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.Review;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.ReviewRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewService(
        ReviewRepository reviewRepository,
        ProductRepository productRepository,
        UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public List<ReviewResponse> getReviews(Long productId) {
        return reviewRepository.findByProduct_IdOrderByCreatedAtDesc(productId).stream()
            .map(ReviewResponse::new)
            .toList();
    }

    @Transactional
    public ReviewResponse createReview(Long productId, String email, int rating, String content) {
        validateRating(rating);
        String trimmedContent = validateContent(content);

        Product product = findProduct(productId);
        User user = findUser(email);

        if (reviewRepository.findByProduct_IdAndUser_Id(productId, user.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 이 상품에 리뷰를 작성했습니다.");
        }

        Review saved = reviewRepository.save(new Review(product, user, rating, trimmedContent));
        refreshProductRating(product);

        return new ReviewResponse(saved);
    }

    @Transactional
    public ReviewResponse updateReview(Long productId, Long reviewId, String email, int rating, String content) {
        validateRating(rating);
        String trimmedContent = validateContent(content);

        Review review = findOwnedReview(productId, reviewId, email);
        review.setRating(rating);
        review.setContent(trimmedContent);

        refreshProductRating(review.getProduct());
        return new ReviewResponse(review);
    }

    @Transactional
    public void deleteReview(Long productId, Long reviewId, String email, boolean isAdmin) {
        Review review = isAdmin
            ? findReviewInProduct(productId, reviewId)
            : findOwnedReview(productId, reviewId, email);

        Product product = review.getProduct();
        reviewRepository.delete(review);
        refreshProductRating(product);
    }

    // 💡 리뷰 삭제 직후 남은 리뷰로 평점/개수를 다시 계산한다. 매번 재계산이라 편집/삭제에서도 항상 정확하다.
    private void refreshProductRating(Product product) {
        long count = reviewRepository.countByProduct_Id(product.getId());
        Double average = count == 0 ? 0.0 : reviewRepository.findAverageRatingByProductId(product.getId());
        double rounded = Math.round(average * 10) / 10.0;
        product.applyReviewStats(rounded, (int) count);
    }

    private Review findOwnedReview(Long productId, Long reviewId, String email) {
        Review review = findReviewInProduct(productId, reviewId);

        if (!review.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 리뷰만 수정/삭제할 수 있습니다.");
        }
        return review;
    }

    private Review findReviewInProduct(Long productId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다: " + reviewId));

        if (!review.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다: " + reviewId);
        }
        return review;
    }

    private void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "별점은 1~5 사이여야 합니다.");
        }
    }

    private String validateContent(String content) {
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "리뷰 내용을 입력해주세요.");
        }
        return content.trim();
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }
}
