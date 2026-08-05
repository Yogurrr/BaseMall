package lsy.toy.backend.Dto;

public class MonthlyRevenuePoint {
    private final int month;
    private final long revenue;

    public MonthlyRevenuePoint(int month, long revenue) {
        this.month = month;
        this.revenue = revenue;
    }

    public int getMonth() { return month; }
    public long getRevenue() { return revenue; }
}
