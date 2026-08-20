package lsy.toy.backend.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

// 💡 사용자별 최근 본 상품 한 줄. 같은 상품을 다시 보면 새 행을 만들지 않고 viewedAt만 갱신하므로
// 사용자당 상품 하나에 한 행만 존재하도록 유니크 제약을 건다(WishlistItem과 동일한 구조).
@Entity
@Table(name = "recent_view_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"}))
public class RecentViewItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private Instant viewedAt;

    protected RecentViewItem() {
        // JPA
    }

    public RecentViewItem(User user, Product product, Instant viewedAt) {
        this.user = user;
        this.product = product;
        this.viewedAt = viewedAt;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Product getProduct() { return product; }
    public Instant getViewedAt() { return viewedAt; }
    public void setViewedAt(Instant viewedAt) { this.viewedAt = viewedAt; }
}
