package lsy.toy.backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// 💡 주문 시점의 상품 정보를 스냅샷으로 저장한다. 이후 상품명/가격이 바뀌거나
// 상품이 삭제되어도 과거 주문 내역은 그대로 남아야 하므로 Product를 참조하지 않는다.
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // 💡 표시용 스냅샷과 별개로, 리뷰 작성 시 "이 상품을 실제로 구매했는지" 검증하는 용도로만 쓴다.
    @Column(name = "product_id")
    private Long productId;

    private String productName;
    private String category;

    @Column(name = "image_url")
    private String imageUrl;

    private Integer unitPrice;
    private int quantity;

    // 💡 주문 시점 유니폼 옵션 스냅샷 (장바구니와 동일한 의미).
    private String size;

    @Column(name = "marking_name")
    private String markingName;

    // 💡 매출 통계의 구단별 집계용 스냅샷. category와 마찬가지로 Product를 참조하지 않는다.
    private String team;

    protected OrderItem() {
        // JPA
    }

    public OrderItem(Long productId, String productName, String category, String imageUrl, Integer unitPrice, int quantity, String size, String markingName, String team) {
        this.productId = productId;
        this.productName = productName;
        this.category = category;
        this.imageUrl = imageUrl;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.size = size;
        this.markingName = markingName;
        this.team = team;
    }

    public Long getId() { return id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Long getProductId() { return productId; }

    public String getProductName() { return productName; }
    public String getCategory() { return category; }
    public String getImageUrl() { return imageUrl; }
    public Integer getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
    public String getSize() { return size; }
    public String getMarkingName() { return markingName; }
    public String getTeam() { return team; }
}
