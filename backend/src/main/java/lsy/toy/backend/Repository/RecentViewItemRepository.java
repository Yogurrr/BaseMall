package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.RecentViewItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecentViewItemRepository extends JpaRepository<RecentViewItem, Long> {
    // 💡 마이페이지에 너무 많은 이력이 쌓이지 않도록 최근 30개만 보여준다(호출부에서 PageRequest.of(0, 30) 전달).
    // product가 @ManyToOne(EAGER)라 fetch join 없이 조회하면 최대 30번의 상품 N+1이 발생하므로 fetch join.
    // findTopN 파생 쿼리 키워드는 @Query와 함께 못 쓰므로 Pageable로 개수를 제한한다.
    @Query("SELECT r FROM RecentViewItem r JOIN FETCH r.product WHERE r.user.id = :userId ORDER BY r.viewedAt DESC")
    List<RecentViewItem> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    Optional<RecentViewItem> findByUser_IdAndProduct_Id(Long userId, Long productId);
}
