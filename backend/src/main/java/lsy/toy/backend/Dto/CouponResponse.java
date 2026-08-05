package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Coupon;

import java.time.Instant;

public class CouponResponse {
    private final Long id;
    private final String name;
    private final String grade;
    private final Integer discountPercent;
    private final Instant issuedAt;
    private final Instant usedAt;

    public CouponResponse(Coupon coupon) {
        this.id = coupon.getId();
        this.name = coupon.getName();
        this.grade = coupon.getGrade();
        this.discountPercent = coupon.getDiscountPercent();
        this.issuedAt = coupon.getIssuedAt();
        this.usedAt = coupon.getUsedAt();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getGrade() { return grade; }
    public Integer getDiscountPercent() { return discountPercent; }
    public Instant getIssuedAt() { return issuedAt; }
    public Instant getUsedAt() { return usedAt; }
}
