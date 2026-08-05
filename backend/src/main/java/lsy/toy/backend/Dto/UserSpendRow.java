package lsy.toy.backend.Dto;

// 💡 회원 등급(구매금액 기준) 집계 전용 프로젝션.
public class UserSpendRow {
    private final Long userId;
    private final Long totalSpend;

    public UserSpendRow(Long userId, Long totalSpend) {
        this.userId = userId;
        this.totalSpend = totalSpend;
    }

    public Long getUserId() { return userId; }
    public Long getTotalSpend() { return totalSpend; }
}
