package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByUseAt(String useAt);

    // 💡 검색어/카테고리/구단 필터를 동시에 조합할 수 있도록 하나의 쿼리로 통일한다.
    // 각 조건은 null이면 무시되므로, 목록 조회·카테고리/구단 필터·검색을 이 메서드 하나로 처리한다.
    @Query("""
        SELECT p FROM Product p
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
}
