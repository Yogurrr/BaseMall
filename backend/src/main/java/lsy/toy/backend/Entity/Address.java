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

import java.time.Instant;

// 💡 주문/결제 화면에서 저장해두는 배송지 한 건. 다음 주문 때 목록에서 골라 자동입력한다.
@Entity
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String label;
    private String recipientName;
    private String recipientPhone;
    private String zipCode;
    private String address;
    private String addressDetail;

    @Column(nullable = false)
    private boolean isDefault = false;

    private Instant createdAt = Instant.now();

    protected Address() {
        // JPA
    }

    public Address(
        User user,
        String label,
        String recipientName,
        String recipientPhone,
        String zipCode,
        String address,
        String addressDetail
    ) {
        this.user = user;
        this.label = label;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.zipCode = zipCode;
        this.address = address;
        this.addressDetail = addressDetail;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAddressDetail() { return addressDetail; }
    public void setAddressDetail(String addressDetail) { this.addressDetail = addressDetail; }

    public boolean getIsDefault() { return isDefault; }
    public void setIsDefault(boolean isDefault) { this.isDefault = isDefault; }

    public Instant getCreatedAt() { return createdAt; }
}
