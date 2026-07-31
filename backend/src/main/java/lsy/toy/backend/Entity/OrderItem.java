package lsy.toy.backend.Entity;

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

    private String productName;
    private String category;
    private String emoji;
    private Integer unitPrice;
    private int quantity;

    protected OrderItem() {
        // JPA
    }

    public OrderItem(String productName, String category, String emoji, Integer unitPrice, int quantity) {
        this.productName = productName;
        this.category = category;
        this.emoji = emoji;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
    }

    public Long getId() { return id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public String getProductName() { return productName; }
    public String getCategory() { return category; }
    public String getEmoji() { return emoji; }
    public Integer getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
}
