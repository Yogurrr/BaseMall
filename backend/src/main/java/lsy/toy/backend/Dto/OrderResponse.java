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
    private final Instant createdAt;
    private final List<OrderItemResponse> items;

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.buyerName = order.getUser().getName();
        this.buyerEmail = order.getUser().getEmail();
        this.status = order.getStatus();
        this.totalPrice = order.getTotalPrice();
        this.createdAt = order.getCreatedAt();
        this.items = order.getItems().stream().map(OrderItemResponse::new).toList();
    }

    public Long getId() { return id; }
    public String getBuyerName() { return buyerName; }
    public String getBuyerEmail() { return buyerEmail; }
    public String getStatus() { return status; }
    public Integer getTotalPrice() { return totalPrice; }
    public Instant getCreatedAt() { return createdAt; }
    public List<OrderItemResponse> getItems() { return items; }
}
