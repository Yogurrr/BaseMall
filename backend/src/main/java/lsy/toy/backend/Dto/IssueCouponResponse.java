package lsy.toy.backend.Dto;

public class IssueCouponResponse {
    private final int issuedCount;

    public IssueCouponResponse(int issuedCount) {
        this.issuedCount = issuedCount;
    }

    public int getIssuedCount() { return issuedCount; }
}
