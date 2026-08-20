package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.Qna;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QnaRepository extends JpaRepository<Qna, Long> {

    // 💡 user가 LAZY라 JOIN FETCH 없이 조회하면 질문 개수만큼 작성자를 따로 SELECT하는 N+1이 발생한다.
    @Query("SELECT q FROM Qna q JOIN FETCH q.user WHERE q.product.id = :productId ORDER BY q.createdAt DESC")
    List<Qna> findByProduct_IdOrderByCreatedAtDesc(@Param("productId") Long productId);

    // 💡 product가 LAZY라 JOIN FETCH 없이 조회하면 질문 개수만큼 상품을 따로 SELECT하는 N+1이 발생한다.
    @Query("SELECT q FROM Qna q JOIN FETCH q.product WHERE q.user.id = :userId ORDER BY q.createdAt DESC")
    List<Qna> findByUser_IdOrderByCreatedAtDesc(@Param("userId") Long userId);

    // 💡 관리자 전체 목록. product/user를 함께 가져와야 화면에서 상품명/작성자명을 보여줄 수 있다.
    @Query("SELECT q FROM Qna q JOIN FETCH q.user JOIN FETCH q.product ORDER BY q.createdAt DESC")
    List<Qna> findAllByOrderByCreatedAtDesc();
}
