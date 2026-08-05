package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.OrderItem;

public class OrderItemResponse {
    private final String name;
    private final String category;
    private final String imageUrl;
    private final Integer price;
    private final int quantity;
    private final String size;
    private final String markingName;

    public OrderItemResponse(OrderItem item) {
        this.name = item.getProductName();
        this.category = item.getCategory();
        this.imageUrl = item.getImageUrl();
        this.price = item.getUnitPrice();
        this.quantity = item.getQuantity();
        this.size = item.getSize();
        this.markingName = item.getMarkingName();
    }

    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getImageUrl() { return imageUrl; }
    public Integer getPrice() { return price; }
    public int getQuantity() { return quantity; }
    public String getSize() { return size; }
    public String getMarkingName() { return markingName; }
}
