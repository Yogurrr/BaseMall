package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Product;

public class ProductResponse {
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
    private final String description;
    private final String detailImageUrl;

    public ProductResponse(
        Long id, String name, String category, String team, Integer price, Integer originalPrice,
        double rating, int reviewCount, String imageUrl, String badge, int stock, String status,
        String description, String detailImageUrl
    ) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.team = team;
        this.price = price;
        this.originalPrice = originalPrice;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.imageUrl = imageUrl;
        this.badge = badge;
        this.stock = stock;
        this.status = status;
        this.description = description;
        this.detailImageUrl = detailImageUrl;
    }

    public static ProductResponse from(Product product) {
        return new ProductResponse(
            product.getId(), product.getName(), product.getCategoryName(), product.getTeamName(),
            product.getPrice(), product.getOriginalPrice(), product.getRating(), product.getReviewCount(),
            product.getImageUrl(), product.getBadge(), product.getStock(), product.getStatus(),
            product.getDescription(), product.getDetailImageUrl()
        );
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
    public String getDescription() { return description; }
    public String getDetailImageUrl() { return detailImageUrl; }
}
