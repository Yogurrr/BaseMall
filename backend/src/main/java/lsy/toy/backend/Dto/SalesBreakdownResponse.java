package lsy.toy.backend.Dto;

import java.util.List;

public class SalesBreakdownResponse {
    private final long totalRevenue;
    private final List<RevenueByGroup> byTeam;
    private final List<RevenueByGroup> byCategory;

    public SalesBreakdownResponse(long totalRevenue, List<RevenueByGroup> byTeam, List<RevenueByGroup> byCategory) {
        this.totalRevenue = totalRevenue;
        this.byTeam = byTeam;
        this.byCategory = byCategory;
    }

    public long getTotalRevenue() { return totalRevenue; }
    public List<RevenueByGroup> getByTeam() { return byTeam; }
    public List<RevenueByGroup> getByCategory() { return byCategory; }
}
