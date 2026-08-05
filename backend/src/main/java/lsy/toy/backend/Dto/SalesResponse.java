package lsy.toy.backend.Dto;

import java.util.List;

public class SalesResponse {
    private final long todayRevenue;
    private final long monthRevenue;
    private final long yearRevenue;
    private final List<MonthlyRevenuePoint> monthlyTrend;

    public SalesResponse(long todayRevenue, long monthRevenue, long yearRevenue, List<MonthlyRevenuePoint> monthlyTrend) {
        this.todayRevenue = todayRevenue;
        this.monthRevenue = monthRevenue;
        this.yearRevenue = yearRevenue;
        this.monthlyTrend = monthlyTrend;
    }

    public long getTodayRevenue() { return todayRevenue; }
    public long getMonthRevenue() { return monthRevenue; }
    public long getYearRevenue() { return yearRevenue; }
    public List<MonthlyRevenuePoint> getMonthlyTrend() { return monthlyTrend; }
}
