package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Product;

// 💡 프론트엔드 CartItem(Product + quantity) 모양과 맞춘 응답 DTO
public class CartItemResponse {
    private final Long id;
    private final String name;
    private final String category;
    private final Integer price;
    private final Integer originalPrice;
    private final double rating;
    private final int reviewCount;
    private final String emoji;
    private final String badge;
    private final int quantity;

    public CartItemResponse(Product product, int quantity) {
        this.id = product.getId();
        this.name = product.getName();
        this.category = product.getCategoryName();
        this.price = product.getPrice();
        this.originalPrice = product.getOriginalPrice();
        this.rating = product.getRating();
        this.reviewCount = product.getReviewCount();
        this.emoji = product.getEmoji();
        this.badge = product.getBadge();
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public Integer getPrice() { return price; }
    public Integer getOriginalPrice() { return originalPrice; }
    public double getRating() { return rating; }
    public int getReviewCount() { return reviewCount; }
    public String getEmoji() { return emoji; }
    public String getBadge() { return badge; }
    public int getQuantity() { return quantity; }
}
