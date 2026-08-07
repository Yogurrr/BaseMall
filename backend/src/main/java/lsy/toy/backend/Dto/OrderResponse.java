package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Order;

import java.time.Instant;
import java.util.List;

public class OrderResponse {
    private final Long id;
    private final String buyerName;
    private final String buyerEmail;
    private final String status;
    private final Integer totalPrice;
    private final Integer discountAmount;
    private final Instant createdAt;
    private final List<OrderItemResponse> items;
    private final String trackingNumber;
    private final String recipientName;
    private final String recipientPhone;
    private final String zipCode;
    private final String address;
    private final String addressDetail;
    private final String deliveryRequest;
    private final String entryMethod;
    private final String entryNote;
    private final String paymentMethod;
    private final Integer pointsUsed;
    private final Integer pointsEarned;

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.buyerName = order.getUser().getName();
        this.buyerEmail = order.getUser().getEmail();
        this.status = order.getStatus();
        this.totalPrice = order.getTotalPrice();
        this.discountAmount = order.getDiscountAmount();
        this.createdAt = order.getCreatedAt();
        this.items = order.getItems().stream().map(OrderItemResponse::new).toList();
        this.trackingNumber = order.getTrackingNumber();
        this.recipientName = order.getRecipientName();
        this.recipientPhone = order.getRecipientPhone();
        this.zipCode = order.getZipCode();
        this.address = order.getAddress();
        this.addressDetail = order.getAddressDetail();
        this.deliveryRequest = order.getDeliveryRequest();
        this.entryMethod = order.getEntryMethod();
        this.entryNote = order.getEntryNote();
        this.paymentMethod = order.getPaymentMethod();
        this.pointsUsed = order.getPointsUsed();
        this.pointsEarned = order.getPointsEarned();
    }

    public Long getId() { return id; }
    public String getBuyerName() { return buyerName; }
    public String getBuyerEmail() { return buyerEmail; }
    public String getStatus() { return status; }
    public Integer getTotalPrice() { return totalPrice; }
    public Integer getDiscountAmount() { return discountAmount; }
    public Instant getCreatedAt() { return createdAt; }
    public List<OrderItemResponse> getItems() { return items; }
    public String getTrackingNumber() { return trackingNumber; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public String getZipCode() { return zipCode; }
    public String getAddress() { return address; }
    public String getAddressDetail() { return addressDetail; }
    public String getDeliveryRequest() { return deliveryRequest; }
    public String getEntryMethod() { return entryMethod; }
    public String getEntryNote() { return entryNote; }
    public String getPaymentMethod() { return paymentMethod; }
    public Integer getPointsUsed() { return pointsUsed; }
    public Integer getPointsEarned() { return pointsEarned; }
}
