package lsy.toy.backend.Dto;

public class CreateOrderRequest {
    private String recipientName;
    private String recipientPhone;
    private String zipCode;
    private String address;
    private String addressDetail;
    private String deliveryRequest;
    private String entryMethod;
    private String entryNote;
    private String paymentMethod;
    private Long couponId;
    private Integer pointsUsed;

    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public String getZipCode() { return zipCode; }
    public String getAddress() { return address; }
    public String getAddressDetail() { return addressDetail; }
    public String getDeliveryRequest() { return deliveryRequest; }
    public String getEntryMethod() { return entryMethod; }
    public String getEntryNote() { return entryNote; }
    public String getPaymentMethod() { return paymentMethod; }
    public Long getCouponId() { return couponId; }
    public Integer getPointsUsed() { return pointsUsed; }
}
