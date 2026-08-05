package lsy.toy.backend.Dto;

// 💡 인기 상품 TOP10 전용 프로젝션.
public class ProductRankRow {
    private final Long id;
    private final String name;
    private final String imageUrl;
    private final String category;
    private final int soldCount;

    public ProductRankRow(Long id, String name, String imageUrl, String category, int soldCount) {
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
        this.category = category;
        this.soldCount = soldCount;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getImageUrl() { return imageUrl; }
    public String getCategory() { return category; }
    public int getSoldCount() { return soldCount; }
}
