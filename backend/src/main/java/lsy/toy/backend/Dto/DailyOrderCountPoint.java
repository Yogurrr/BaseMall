package lsy.toy.backend.Dto;

public class DailyOrderCountPoint {
    private final String date;
    private final long count;

    public DailyOrderCountPoint(String date, long count) {
        this.date = date;
        this.count = count;
    }

    public String getDate() { return date; }
    public long getCount() { return count; }
}
