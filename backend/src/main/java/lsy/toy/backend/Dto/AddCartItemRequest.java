package lsy.toy.backend.Dto;

public class AddCartItemRequest {
    private Long productId;
    private Integer quantity;
    private String size;
    private String markingName;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getMarkingName() { return markingName; }
    public void setMarkingName(String markingName) { this.markingName = markingName; }
}
