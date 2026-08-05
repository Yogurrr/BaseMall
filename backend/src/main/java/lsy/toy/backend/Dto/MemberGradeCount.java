package lsy.toy.backend.Dto;

public class MemberGradeCount {
    private final String grade;
    private final long count;

    public MemberGradeCount(String grade, long count) {
        this.grade = grade;
        this.count = count;
    }

    public String getGrade() { return grade; }
    public long getCount() { return count; }
}
