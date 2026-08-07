package lsy.toy.backend.Dto;

public class TossReadyResponse {
    private final String orderId;
    private final int amount;
    private final String orderName;

    public TossReadyResponse(String orderId, int amount, String orderName) {
        this.orderId = orderId;
        this.amount = amount;
        this.orderName = orderName;
    }

    public String getOrderId() { return orderId; }
    public int getAmount() { return amount; }
    public String getOrderName() { return orderName; }
}
