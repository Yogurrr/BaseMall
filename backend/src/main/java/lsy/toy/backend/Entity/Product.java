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

import java.time.Instant;

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

    // 💡 기존에 데이터가 있는 테이블에 NOT NULL 컬럼을 추가할 때 Postgres가 거부하지 않도록
    // DEFAULT를 DDL에 직접 포함시킨다 (ddl-auto=update가 기존 행에 값을 채워 넣게 함).
    @Column(columnDefinition = "integer not null default 50")
    private int stock = 50;

    // 💡 판매중 | 판매중지 | 품절. stock과 마찬가지로 기존 행을 위한 DEFAULT를 DDL에 포함.
    @Column(columnDefinition = "varchar(10) not null default '판매중'")
    private String status = "판매중";

    // 💡 인기순/판매순 정렬용 누적 판매 수량. 주문이 생성될 때마다 OrderService가 증가시킨다.
    @Column(columnDefinition = "integer not null default 0")
    private int soldCount = 0;

    // 💡 신상품순 정렬용. stock/status와 마찬가지로 기존 행을 위한 DEFAULT를 DDL에 포함.
    // Instant는 Hibernate가 TIMESTAMP_UTC로 검증하므로 timestamptz여야 한다(V2 마이그레이션 참고).
    @Column(columnDefinition = "timestamptz not null default now()")
    private Instant createdAt = Instant.now();

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

    public int getStock() { return stock; }

    // 💡 재고가 0이 되면 자동으로 품절 처리하고, 품절 상태에서 재입고되면 자동으로 판매중으로 되돌린다.
    // 판매중지는 관리자가 재고와 무관하게 내린 결정이므로 이 자동 전환 대상에서 제외한다.
    public void setStock(int stock) {
        this.stock = stock;
        if (stock == 0) {
            if (!"판매중지".equals(this.status)) {
                this.status = "품절";
            }
        } else if ("품절".equals(this.status)) {
            this.status = "판매중";
        }
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getSoldCount() { return soldCount; }
    public void incrementSoldCount(int amount) { this.soldCount += amount; }

    public Instant getCreatedAt() { return createdAt; }
}
