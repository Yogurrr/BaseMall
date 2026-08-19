package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 💡 user가 LAZY라 JOIN FETCH 없이 조회하면 리뷰 개수만큼 작성자를 따로 SELECT하는 N+1이 발생한다.
    @Query("SELECT r FROM Review r JOIN FETCH r.user WHERE r.product.id = :productId ORDER BY r.createdAt DESC")
    List<Review> findByProduct_IdOrderByCreatedAtDesc(@Param("productId") Long productId);

    Optional<Review> findByProduct_IdAndUser_Id(Long productId, Long userId);

    // 💡 product가 LAZY라 JOIN FETCH 없이 조회하면 리뷰 개수만큼 상품을 따로 SELECT하는 N+1이 발생한다.
    @Query("SELECT r FROM Review r JOIN FETCH r.product WHERE r.user.id = :userId ORDER BY r.createdAt DESC")
    List<Review> findByUser_IdOrderByCreatedAtDesc(@Param("userId") Long userId);

    long countByProduct_Id(Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);
}
