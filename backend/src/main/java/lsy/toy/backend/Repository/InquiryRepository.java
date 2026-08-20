package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    // 💡 user가 LAZY라 JOIN FETCH 없이 조회하면 문의 개수만큼 작성자를 따로 SELECT하는 N+1이 발생한다.
    @Query("SELECT i FROM Inquiry i JOIN FETCH i.user WHERE i.user.id = :userId ORDER BY i.createdAt DESC")
    List<Inquiry> findByUser_IdOrderByCreatedAtDesc(@Param("userId") Long userId);

    // 💡 관리자 전체 목록. order는 nullable이라 LEFT JOIN FETCH.
    @Query("SELECT i FROM Inquiry i JOIN FETCH i.user LEFT JOIN FETCH i.order ORDER BY i.createdAt DESC")
    List<Inquiry> findAllByOrderByCreatedAtDesc();
}
