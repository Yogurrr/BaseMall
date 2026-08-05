package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Product;

// 💡 프론트엔드 Product 모양과 그대로 맞춘 응답 DTO (수량 개념이 없다는 점만 CartItemResponse와 다름)
public class WishlistItemResponse {
    private final Long id;
    private final String name;
    private final String category;
    private final String team;
    private final Integer price;
    private final Integer originalPrice;
    private final double rating;
    private final int reviewCount;
    private final String imageUrl;
    private final String badge;
    private final int stock;
    private final String status;

    public WishlistItemResponse(Product product) {
        this.id = product.getId();
        this.name = product.getName();
        this.category = product.getCategoryName();
        this.team = product.getTeamName();
        this.price = product.getPrice();
        this.originalPrice = product.getOriginalPrice();
        this.rating = product.getRating();
        this.reviewCount = product.getReviewCount();
        this.imageUrl = product.getImageUrl();
        this.badge = product.getBadge();
        this.stock = product.getStock();
        this.status = product.getStatus();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getTeam() { return team; }
    public Integer getPrice() { return price; }
    public Integer getOriginalPrice() { return originalPrice; }
    public double getRating() { return rating; }
    public int getReviewCount() { return reviewCount; }
    public String getImageUrl() { return imageUrl; }
    public String getBadge() { return badge; }
    public int getStock() { return stock; }
    public String getStatus() { return status; }
}
