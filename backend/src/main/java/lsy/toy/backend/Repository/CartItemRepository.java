package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser_IdOrderByIdAsc(Long userId);

    // 💡 사이즈/마킹 등 옵션이 null일 수도 있어 단순 '=' 비교로는 매칭이 안 되므로
    // COALESCE로 null을 빈 문자열로 맞춰 비교한다 (옵션 값에 빈 문자열은 쓰지 않는다는 전제).
    @Query("""
        SELECT c FROM CartItem c
        WHERE c.user.id = :userId AND c.product.id = :productId
          AND COALESCE(c.size, '') = COALESCE(:size, '')
          AND COALESCE(c.markingName, '') = COALESCE(:markingName, '')
        """)
    Optional<CartItem> findMatchingItem(
        @Param("userId") Long userId,
        @Param("productId") Long productId,
        @Param("size") String size,
        @Param("markingName") String markingName
    );

    Optional<CartItem> findByIdAndUser_Id(Long id, Long userId);

    void deleteByIdAndUser_Id(Long id, Long userId);

    void deleteByUser_Id(Long userId);
}
