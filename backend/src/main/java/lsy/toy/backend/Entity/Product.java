package lsy.toy.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // 💡 구단별 카테고리. 상품 종류(category)와 별도 축으로, 특정 구단에 속하지 않는 상품은 null.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    private Team team;

    private Integer price;
    private Integer originalPrice;
    private double rating;
    private int reviewCount;
    private String emoji;
    private String badge;

    @Column(name = "use_at")
    private String useAt = "Y"; // 💡 소프트 삭제 플래그: Y=노출, N=삭제됨

    protected Product() {
        // JPA
    }

    public Product(String name, Category category, Integer price, Integer originalPrice, double rating, int reviewCount, String emoji, String badge) {
        this.name = name;
        this.category = category;
        this.price = price;
        this.originalPrice = originalPrice;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.emoji = emoji;
        this.badge = badge;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    // 💡 프론트엔드는 category를 문자열로 사용하므로, 연관관계는 유지하되 이름만 노출한다.
    @JsonProperty("category")
    public String getCategoryName() { return category != null ? category.getName() : null; }

    @JsonIgnore
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    @JsonProperty("team")
    public String getTeamName() { return team != null ? team.getName() : null; }

    @JsonIgnore
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }

    public Integer getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Integer originalPrice) { this.originalPrice = originalPrice; }

    public double getRating() { return rating; }

    public int getReviewCount() { return reviewCount; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public String getUseAt() { return useAt; }
    public void setUseAt(String useAt) { this.useAt = useAt; }
}
