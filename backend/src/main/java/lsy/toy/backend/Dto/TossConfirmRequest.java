package lsy.toy.backend.Dto;

public class TossConfirmRequest {
    private String paymentKey;
    private String orderId;
    private int amount;

    public String getPaymentKey() { return paymentKey; }
    public String getOrderId() { return orderId; }
    public int getAmount() { return amount; }
}
