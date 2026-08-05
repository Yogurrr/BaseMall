package lsy.toy.backend.Dto;

import java.util.List;

public class OrderCountStatsResponse {
    private final List<DailyOrderCountPoint> daily;
    private final List<MonthlyOrderCountPoint> monthly;

    public OrderCountStatsResponse(List<DailyOrderCountPoint> daily, List<MonthlyOrderCountPoint> monthly) {
        this.daily = daily;
        this.monthly = monthly;
    }

    public List<DailyOrderCountPoint> getDaily() { return daily; }
    public List<MonthlyOrderCountPoint> getMonthly() { return monthly; }
}
