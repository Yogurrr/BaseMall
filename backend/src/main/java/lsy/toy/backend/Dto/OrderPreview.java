package lsy.toy.backend.Dto;

// 💡 주문을 실제로 만들지 않고 금액/품목명만 미리 계산한 결과. 카카오페이 ready 단계에서
// 결제 요청 금액이 실제 주문 생성 시 계산되는 금액과 정확히 일치하도록 OrderService.previewOrder가 반환한다.
public class OrderPreview {
    private final int totalPrice;
    private final String itemName;
    private final int quantity;

    public OrderPreview(int totalPrice, String itemName, int quantity) {
        this.totalPrice = totalPrice;
        this.itemName = itemName;
        this.quantity = quantity;
    }

    public int getTotalPrice() { return totalPrice; }
    public String getItemName() { return itemName; }
    public int getQuantity() { return quantity; }
}
