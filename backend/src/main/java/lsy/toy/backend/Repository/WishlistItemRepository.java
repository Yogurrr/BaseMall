package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    // 💡 product가 @ManyToOne(EAGER)라 fetch join 없이 조회하면 위시리스트 아이템 개수만큼
    // 상품을 따로 SELECT하는 N+1이 발생한다. 응답 DTO가 product를 그대로 쓰므로 fetch join.
    @Query("SELECT w FROM WishlistItem w JOIN FETCH w.product WHERE w.user.id = :userId ORDER BY w.id DESC")
    List<WishlistItem> findByUser_IdOrderByIdDesc(@Param("userId") Long userId);

    boolean existsByUser_IdAndProduct_Id(Long userId, Long productId);

    void deleteByUser_IdAndProduct_Id(Long userId, Long productId);
}
