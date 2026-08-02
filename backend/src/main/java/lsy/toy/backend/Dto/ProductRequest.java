package lsy.toy.backend.Dto;

public class ProductRequest {
    private String name;
    private String category;
    private String team;
    private Integer price;
    private Integer originalPrice;
    private String emoji;
    private String badge;
    private Integer stock;

    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getTeam() { return team; }
    public Integer getPrice() { return price; }
    public Integer getOriginalPrice() { return originalPrice; }
    public String getEmoji() { return emoji; }
    public String getBadge() { return badge; }
    public Integer getStock() { return stock; }
}
