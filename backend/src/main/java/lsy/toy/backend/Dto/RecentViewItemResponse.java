package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Product;

import java.time.Instant;

// 💡 프론트엔드 Product 모양에 viewedAt만 얹은 응답 DTO (WishlistItemResponse와 동일 패턴).
public class RecentViewItemResponse {
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
    private final Instant viewedAt;

    public RecentViewItemResponse(Product product, Instant viewedAt) {
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
        this.viewedAt = viewedAt;
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
    public Instant getViewedAt() { return viewedAt; }
}
