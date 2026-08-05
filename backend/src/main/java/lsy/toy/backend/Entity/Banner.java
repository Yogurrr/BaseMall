package lsy.toy.backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "banners")
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String eyebrow;
    private String title;
    private String description;

    @Column(name = "cta_label")
    private String ctaLabel;

    private String gradient;

    @Column(name = "image_url")
    private String imageUrl;

    // 💡 홈 화면 캐러셀에 보여줄 순서. 값이 같으면 id 오름차순으로 정렬한다.
    @Column(name = "sort_order")
    private int sortOrder;

    // 💡 삭제하지 않고도 노출을 껐다 켤 수 있도록 하는 플래그.
    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    protected Banner() {
        // JPA
    }

    public Banner(String eyebrow, String title, String description, String ctaLabel, String gradient, String imageUrl, int sortOrder) {
        this.eyebrow = eyebrow;
        this.title = title;
        this.description = description;
        this.ctaLabel = ctaLabel;
        this.gradient = gradient;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }

    public String getEyebrow() { return eyebrow; }
    public void setEyebrow(String eyebrow) { this.eyebrow = eyebrow; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCtaLabel() { return ctaLabel; }
    public void setCtaLabel(String ctaLabel) { this.ctaLabel = ctaLabel; }

    public String getGradient() { return gradient; }
    public void setGradient(String gradient) { this.gradient = gradient; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
}
