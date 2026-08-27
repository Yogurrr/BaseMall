package lsy.toy.backend.Repository;

import lsy.toy.backend.Dto.CategorySalesRow;
import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 💡 인기 상품 TOP10 - 이미 있는 누적 판매 수량(soldCount) 컬럼을 그대로 정렬 기준으로 쓴다.
    // category/team이 @ManyToOne(EAGER)라 fetch join 없이 조회하면 상품 개수만큼(최대 10개씩 2번)
    // categories/teams를 따로 SELECT하는 N+1이 발생하므로 fetch join.
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.team WHERE p.useAt = :useAt ORDER BY p.soldCount DESC")
    List<Product> findTop10ByUseAtOrderBySoldCountDesc(@Param("useAt") String useAt, Pageable pageable);

    long countByUseAtAndStatus(String useAt, String status);

    // 💡 카테고리 삭제 전, 사용 중인 상품이 있는지 확인하기 위한 존재 여부 조회.
    boolean existsByCategory(Category category);

    // 💡 뱃지 이름 변경/삭제 시, badge가 자유 문자열이라 FK로 자동 반영되지 않으므로
    // BadgeService가 영향받는 상품을 직접 찾아 갱신하기 위해 사용.
    // category/team이 @ManyToOne(EAGER)라 fetch join 없이 조회하면 영향받는 상품 개수만큼 N+1이 발생하므로 fetch join.
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.team WHERE p.badge = :badge")
    List<Product> findByBadge(@Param("badge") String badge);

    @Query("""
        SELECT new lsy.toy.backend.Dto.CategorySalesRow(p.category.name, SUM(p.soldCount))
        FROM Product p
        WHERE p.useAt = 'Y'
        GROUP BY p.category.name
        ORDER BY SUM(p.soldCount) DESC
        """)
    List<CategorySalesRow> findCategorySales();

    // 💡 category/team이 @ManyToOne(EAGER)라 fetch join 없이 조회하면 상품 개수만큼
    // categories/teams를 따로 SELECT하는 N+1이 발생한다. 어드민 상품 목록(전체/삭제됨)에서 씀.
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.team WHERE p.useAt = :useAt")
    List<Product> findByUseAt(@Param("useAt") String useAt);

    // 💡 검색어/카테고리/구단 필터를 동시에 조합할 수 있도록 하나의 쿼리로 통일한다.
    // 각 조건은 null이면 무시되므로, 목록 조회·카테고리/구단 필터·검색을 이 메서드 하나로 처리한다.
    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.team
        WHERE p.useAt = 'Y'
          AND (CAST(:keyword AS string) IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
          AND (CAST(:category AS string) IS NULL OR p.category.name = CAST(:category AS string))
          AND (CAST(:team AS string) IS NULL OR p.team.name = CAST(:team AS string))
        """)
    Page<Product> search(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("team") String team,
        Pageable pageable
    );

    // 💡 할인율은 저장된 컬럼이 아니라 (원가-판매가)/원가로 계산되는 값이라 Pageable의 Sort로는
    // 표현할 수 없다. 그래서 ORDER BY를 쿼리에 직접 박아 넣은 전용 메서드로 분리한다.
    // 정가가 없거나 0이면 할인이 없는 것으로 취급해 맨 뒤로 보낸다.
    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.team
        WHERE p.useAt = 'Y'
          AND (CAST(:keyword AS string) IS NULL
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
          AND (CAST(:category AS string) IS NULL OR p.category.name = CAST(:category AS string))
          AND (CAST(:team AS string) IS NULL OR p.team.name = CAST(:team AS string))
        ORDER BY CASE
            WHEN p.originalPrice IS NULL OR p.originalPrice = 0 THEN 0
            ELSE (CAST(p.originalPrice AS double) - p.price) / p.originalPrice
          END DESC
        """)
    Page<Product> searchOrderByDiscountDesc(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("team") String team,
        Pageable pageable
    );
}
