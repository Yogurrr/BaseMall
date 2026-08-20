package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.ReviewResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.Review;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.OrderItemRepository;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.ReviewRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private PointService pointService;

    @InjectMocks
    private ReviewService reviewService;

    private User user(long id, String email) {
        User user = new User("구매자", email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Product product(long id) {
        Product product = new Product("유니폼", null, 10_000, 10_000, 0, 0, "img.png", null);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    private Review review(Product product, User author) {
        Review review = new Review(product, author, 5, "좋아요");
        ReflectionTestUtils.setField(review, "id", 1L);
        return review;
    }

    @Test
    void createReview_구매하지않은상품이면_403을던진다() {
        Product product = product(10L);
        User user = user(1L, "buyer@example.com");
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderItemRepository.existsByProductIdAndOrder_User_IdAndOrder_StatusNot(10L, 1L, "주문취소"))
            .thenReturn(false);

        assertThatThrownBy(() -> reviewService.createReview(10L, "buyer@example.com", 5, "좋아요"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void createReview_이미리뷰를작성했으면_409를던진다() {
        Product product = product(10L);
        User user = user(1L, "buyer@example.com");
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderItemRepository.existsByProductIdAndOrder_User_IdAndOrder_StatusNot(10L, 1L, "주문취소"))
            .thenReturn(true);
        when(reviewRepository.findByProduct_IdAndUser_Id(10L, 1L)).thenReturn(Optional.of(review(product, user)));

        assertThatThrownBy(() -> reviewService.createReview(10L, "buyer@example.com", 5, "좋아요"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
    }

    @Test
    void createReview_성공하면_적립금을지급한다() {
        Product product = product(10L);
        User user = user(1L, "buyer@example.com");
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderItemRepository.existsByProductIdAndOrder_User_IdAndOrder_StatusNot(10L, 1L, "주문취소"))
            .thenReturn(true);
        when(reviewRepository.findByProduct_IdAndUser_Id(10L, 1L)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reviewRepository.countByProduct_Id(10L)).thenReturn(1L);
        when(reviewRepository.findAverageRatingByProductId(10L)).thenReturn(5.0);

        ReviewResponse response = reviewService.createReview(10L, "buyer@example.com", 5, "좋아요");

        assertThat(response.getRating()).isEqualTo(5);
        verify(pointService).record(eq(user), eq(500), eq("REVIEW_REWARD"), eq(null), any(Review.class), any());
    }

    @Test
    void deleteReview_본인리뷰가아니면_403을던진다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Review review = review(product, author);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewService.deleteReview(10L, 1L, "other@example.com", false))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));

        verify(reviewRepository, never()).delete(any());
    }

    @Test
    void deleteReview_관리자는_소유권검사없이삭제할수있다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Review review = review(product, author);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.countByProduct_Id(10L)).thenReturn(0L);

        reviewService.deleteReview(10L, 1L, "admin@example.com", true);

        verify(reviewRepository).delete(review);
    }

    @Test
    void deleteReview_삭제하면_지급했던적립금을회수한다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Review review = review(product, author);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.countByProduct_Id(10L)).thenReturn(0L);

        reviewService.deleteReview(10L, 1L, "author@example.com", false);

        verify(pointService).record(eq(author), eq(-500), eq("REVIEW_REWARD_REVOKE"), eq(null), eq(null), any());
    }
}
