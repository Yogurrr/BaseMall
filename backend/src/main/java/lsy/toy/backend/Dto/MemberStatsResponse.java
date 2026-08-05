package lsy.toy.backend.Dto;

import java.util.List;

public class MemberStatsResponse {
    private final long todaySignups;
    private final long monthSignups;
    private final long totalMembers;
    private final long totalWithdrawn;
    private final long monthWithdrawn;
    private final List<MemberGradeCount> gradeDistribution;

    public MemberStatsResponse(
        long todaySignups,
        long monthSignups,
        long totalMembers,
        long totalWithdrawn,
        long monthWithdrawn,
        List<MemberGradeCount> gradeDistribution
    ) {
        this.todaySignups = todaySignups;
        this.monthSignups = monthSignups;
        this.totalMembers = totalMembers;
        this.totalWithdrawn = totalWithdrawn;
        this.monthWithdrawn = monthWithdrawn;
        this.gradeDistribution = gradeDistribution;
    }

    public long getTodaySignups() { return todaySignups; }
    public long getMonthSignups() { return monthSignups; }
    public long getTotalMembers() { return totalMembers; }
    public long getTotalWithdrawn() { return totalWithdrawn; }
    public long getMonthWithdrawn() { return monthWithdrawn; }
    public List<MemberGradeCount> getGradeDistribution() { return gradeDistribution; }
}
