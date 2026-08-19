package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.OrderItem;

import java.time.Instant;

public class ReviewableItemResponse {
    private final Long productId;
    private final String productName;
    private final String productImageUrl;
    private final Instant purchasedAt;

    public ReviewableItemResponse(OrderItem item) {
        this.productId = item.getProductId();
        this.productName = item.getProductName();
        this.productImageUrl = item.getImageUrl();
        this.purchasedAt = item.getOrder().getCreatedAt();
    }

    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductImageUrl() { return productImageUrl; }
    public Instant getPurchasedAt() { return purchasedAt; }
}
