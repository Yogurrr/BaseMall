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
import jakarta.persistence.UniqueConstraint;

// 💡 사용자별 장바구니 한 줄(상품 + 수량 + 옵션). 같은 상품이라도 사이즈/마킹이 다르면
// 별도 줄로 취급하므로, 유니크 제약은 상품이 아니라 상품+옵션 조합 기준이다.
@Entity
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id", "size", "marking_name"}))
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private int quantity;

    // 💡 유니폼 상품 전용 옵션. 유니폼이 아닌 상품이면 항상 null.
    private String size;

    @Column(name = "marking_name")
    private String markingName;

    protected CartItem() {
        // JPA
    }

    public CartItem(User user, Product product, int quantity, String size, String markingName) {
        this.user = user;
        this.product = product;
        this.quantity = quantity;
        this.size = size;
        this.markingName = markingName;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Product getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getSize() { return size; }
    public String getMarkingName() { return markingName; }
}
