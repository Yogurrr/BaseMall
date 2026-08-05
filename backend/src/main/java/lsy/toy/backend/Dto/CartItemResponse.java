package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.CartItem;
import lsy.toy.backend.Entity.Product;

// 💡 프론트엔드 CartItem(Product + quantity + 옵션) 모양과 맞춘 응답 DTO.
// cartItemId는 장바구니 줄 자체의 PK(id는 상품 id로 유지 - 상품 링크용).
// 같은 상품이라도 옵션이 다르면 여러 줄이 존재할 수 있어 수정/삭제는 cartItemId로 한다.
public class CartItemResponse {
    private final Long cartItemId;
    private final Long id;
    private final String name;
    private final String category;
    private final Integer price;
    private final Integer originalPrice;
    private final double rating;
    private final int reviewCount;
    private final String imageUrl;
    private final String badge;
    private final int quantity;
    private final String size;
    private final String markingName;

    public CartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        this.cartItemId = cartItem.getId();
        this.id = product.getId();
        this.name = product.getName();
        this.category = product.getCategoryName();
        this.price = product.getPrice();
        this.originalPrice = product.getOriginalPrice();
        this.rating = product.getRating();
        this.reviewCount = product.getReviewCount();
        this.imageUrl = product.getImageUrl();
        this.badge = product.getBadge();
        this.quantity = cartItem.getQuantity();
        this.size = cartItem.getSize();
        this.markingName = cartItem.getMarkingName();
    }

    public Long getCartItemId() { return cartItemId; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public Integer getPrice() { return price; }
    public Integer getOriginalPrice() { return originalPrice; }
    public double getRating() { return rating; }
    public int getReviewCount() { return reviewCount; }
    public String getImageUrl() { return imageUrl; }
    public String getBadge() { return badge; }
    public int getQuantity() { return quantity; }
    public String getSize() { return size; }
    public String getMarkingName() { return markingName; }
}
