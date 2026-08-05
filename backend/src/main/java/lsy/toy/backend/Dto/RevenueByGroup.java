package lsy.toy.backend.Dto;

// 💡 구단별/품목별 매출 집계 결과의 공통 형태 (이름 + 매출액).
public class RevenueByGroup {
    private final String name;
    private final long revenue;

    public RevenueByGroup(String name, long revenue) {
        this.name = name;
        this.revenue = revenue;
    }

    public String getName() { return name; }
    public long getRevenue() { return revenue; }
}
