package lsy.toy.backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// 💡 상품 카드에 붙는 뱃지(NEW/SALE/BEST 등)의 이름과 표시 색상을 관리자가 등록/수정할 수 있게 하는 테이블.
// Product.badge는 이 테이블을 참조하는 FK가 아니라 자유 문자열이라(기존 설계 유지),
// 이름이 바뀌거나 삭제될 때 BadgeService가 기존 상품들의 badge 문자열을 함께 정리해준다.
@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;

    @Column(name = "color_from", nullable = false, length = 20)
    private String colorFrom;

    @Column(name = "color_to", nullable = false, length = 20)
    private String colorTo;

    protected Badge() {
        // JPA
    }

    public Badge(String name, String colorFrom, String colorTo) {
        this.name = name;
        this.colorFrom = colorFrom;
        this.colorTo = colorTo;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColorFrom() { return colorFrom; }
    public void setColorFrom(String colorFrom) { this.colorFrom = colorFrom; }

    public String getColorTo() { return colorTo; }
    public void setColorTo(String colorTo) { this.colorTo = colorTo; }
}
