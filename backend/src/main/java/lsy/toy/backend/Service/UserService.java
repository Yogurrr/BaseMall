package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.MemberGradeCount;
import lsy.toy.backend.Dto.MemberStatsResponse;
import lsy.toy.backend.Dto.UserSpendRow;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.OrderRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    // 💡 매출 통계와 동일하게 한국 시각 기준으로 "오늘"/"이번 달"을 가른다.
    private static final ZoneId STATS_ZONE = ZoneId.of("Asia/Seoul");

    // 💡 구매금액 기준 회원 등급 임계값(데모용 예시 기준, 실제 정책 아님).
    // KBO 컨셉에 맞춰 야구 용어로 등급명을 붙인다: Rookie < Starter < All-Star < MVP.
    private static final long STARTER_THRESHOLD = 50_000;
    private static final long ALL_STAR_THRESHOLD = 200_000;
    private static final long MVP_THRESHOLD = 500_000;

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public UserService(UserRepository userRepository, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    public List<User> getUsers() {
        return userRepository.findByUseAt("Y");
    }

    public MemberStatsResponse getStats() {
        LocalDate today = LocalDate.now(STATS_ZONE);
        Instant startOfToday = today.atStartOfDay(STATS_ZONE).toInstant();
        Instant startOfMonth = today.withDayOfMonth(1).atStartOfDay(STATS_ZONE).toInstant();
        Instant now = Instant.now();

        long todaySignups = userRepository.countByCreatedAtBetween(startOfToday, now);
        long monthSignups = userRepository.countByCreatedAtBetween(startOfMonth, now);
        long totalMembers = userRepository.countByUseAt("Y");
        long totalWithdrawn = userRepository.countByUseAt("N");
        long monthWithdrawn = userRepository.countByUseAtAndWithdrawnAtBetween("N", startOfMonth, now);

        List<MemberGradeCount> gradeDistribution = calculateGradeDistribution();

        return new MemberStatsResponse(
            todaySignups, monthSignups, totalMembers, totalWithdrawn, monthWithdrawn, gradeDistribution
        );
    }

    // 💡 주문이 하나도 없는 회원은 findSpendByUser 결과에 아예 나오지 않으므로,
    // 활성 회원 전체를 기준으로 지출액을 0원으로 채운 뒤 등급을 매긴다.
    private List<MemberGradeCount> calculateGradeDistribution() {
        Map<Long, Long> spendByUser = orderRepository.findSpendByUser().stream()
            .collect(Collectors.toMap(UserSpendRow::getUserId, UserSpendRow::getTotalSpend));

        long rookie = 0, starter = 0, allStar = 0, mvp = 0;
        for (User user : userRepository.findByUseAt("Y")) {
            long spend = spendByUser.getOrDefault(user.getId(), 0L);
            switch (resolveGrade(spend)) {
                case "MVP" -> mvp++;
                case "All-Star" -> allStar++;
                case "Starter" -> starter++;
                default -> rookie++;
            }
        }

        List<MemberGradeCount> distribution = new ArrayList<>();
        distribution.add(new MemberGradeCount("Rookie", rookie));
        distribution.add(new MemberGradeCount("Starter", starter));
        distribution.add(new MemberGradeCount("All-Star", allStar));
        distribution.add(new MemberGradeCount("MVP", mvp));
        return distribution;
    }

    // 💡 마이페이지 등에서 회원 한 명의 등급만 필요할 때 쓴다.
    public String getMemberGrade(Long userId) {
        Long spend = orderRepository.sumSpendByUserId(userId);
        return resolveGrade(spend != null ? spend : 0L);
    }

    private String resolveGrade(long spend) {
        if (spend >= MVP_THRESHOLD) return "MVP";
        if (spend >= ALL_STAR_THRESHOLD) return "All-Star";
        if (spend >= STARTER_THRESHOLD) return "Starter";
        return "Rookie";
    }
}
