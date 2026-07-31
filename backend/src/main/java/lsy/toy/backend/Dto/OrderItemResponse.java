package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.OrderItem;

public class OrderItemResponse {
    private final String name;
    private final String category;
    private final String emoji;
    private final Integer price;
    private final int quantity;

    public OrderItemResponse(OrderItem item) {
        this.name = item.getProductName();
        this.category = item.getCategory();
        this.emoji = item.getEmoji();
        this.price = item.getUnitPrice();
        this.quantity = item.getQuantity();
    }

    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getEmoji() { return emoji; }
    public Integer getPrice() { return price; }
    public int getQuantity() { return quantity; }
}
