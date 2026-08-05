package lsy.toy.backend.Dto;

public class ProductRequest {
    private String name;
    private String category;
    private String team;
    private Integer price;
    private Integer originalPrice;
    private String imageUrl;
    private String badge;
    private Integer stock;
    private String description;
    private String detailImageUrl;

    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getTeam() { return team; }
    public Integer getPrice() { return price; }
    public Integer getOriginalPrice() { return originalPrice; }
    public String getImageUrl() { return imageUrl; }
    public String getBadge() { return badge; }
    public Integer getStock() { return stock; }
    public String getDescription() { return description; }
    public String getDetailImageUrl() { return detailImageUrl; }
}
