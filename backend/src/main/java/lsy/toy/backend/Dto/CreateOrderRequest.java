package lsy.toy.backend.Dto;

public class CreateOrderRequest {
    private String address;
    private Long couponId;

    public String getAddress() { return address; }
    public Long getCouponId() { return couponId; }
}
