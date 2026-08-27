package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.CouponResponse;
import lsy.toy.backend.Entity.Coupon;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CouponRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class CouponService {

    // 💡 등급별 정률 할인율. UserService.resolveGrade()가 반환하는 등급 문자열과 반드시 일치해야 한다.
    private static final Map<String, Integer> GRADE_DISCOUNTS = Map.of(
        "Rookie", 3,
        "Starter", 5,
        "All-Star", 8,
        "MVP", 12
    );

    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public CouponService(CouponRepository couponRepository, UserRepository userRepository, UserService userService) {
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // 💡 대상 등급의 활성 회원 중, 같은 등급의 미사용 쿠폰이 없는 사람에게만 발급한다.
    // (관리자가 같은 등급 버튼을 반복 클릭해도 중복 발급되지 않도록)
    // 💡 회원 수만큼 save()를 반복하므로, 중간에 실패해도 이미 발급된 쿠폰이 남지 않도록
    // 전체를 하나의 트랜잭션으로 묶는다.
    @Transactional
    public int issueByGrade(String grade) {
        Integer discountPercent = GRADE_DISCOUNTS.get(grade);
        if (discountPercent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 등급입니다: " + grade);
        }

        int issuedCount = 0;
        for (User user : userService.getUsers()) {
            if (!grade.equals(userService.getMemberGrade(user.getId()))) {
                continue;
            }
            if (couponRepository.existsByUser_IdAndGradeAndUsedAtIsNull(user.getId(), grade)) {
                continue;
            }

            String name = grade + " 등급 할인 쿠폰 (" + discountPercent + "%)";
            couponRepository.save(new Coupon(user, name, grade, discountPercent));
            issuedCount++;
        }

        return issuedCount;
    }

    public List<CouponResponse> getMyCoupons(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));

        return couponRepository.findByUser_IdOrderByIssuedAtDesc(user.getId()).stream()
            .map(CouponResponse::new)
            .toList();
    }
}
