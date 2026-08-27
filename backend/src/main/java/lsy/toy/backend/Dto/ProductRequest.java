package lsy.toy.backend.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ProductRequest {
    private String name;
    private String category;
    private String team;
    private Integer price;
    private Integer originalPrice;
    private String imageUrl;
    private String badge;
    @NotNull(message = "재고는 0 이상이어야 합니다.")
    @Min(value = 0, message = "재고는 0 이상이어야 합니다.")
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
