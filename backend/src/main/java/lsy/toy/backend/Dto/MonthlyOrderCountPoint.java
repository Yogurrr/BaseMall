package lsy.toy.backend.Dto;

public class MonthlyOrderCountPoint {
    private final int month;
    private final long count;

    public MonthlyOrderCountPoint(int month, long count) {
        this.month = month;
        this.count = count;
    }

    public int getMonth() { return month; }
    public long getCount() { return count; }
}
