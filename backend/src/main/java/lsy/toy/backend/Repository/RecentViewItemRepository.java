package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.RecentViewItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecentViewItemRepository extends JpaRepository<RecentViewItem, Long> {
    // 💡 마이페이지에 너무 많은 이력이 쌓이지 않도록 최근 30개만 보여준다.
    List<RecentViewItem> findTop30ByUser_IdOrderByViewedAtDesc(Long userId);

    Optional<RecentViewItem> findByUser_IdAndProduct_Id(Long userId, Long productId);
}
