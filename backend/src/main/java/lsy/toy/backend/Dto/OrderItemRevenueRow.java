package lsy.toy.backend.Dto;

// 💡 기간별 구단/품목 매출 집계 전용 프로젝션.
public class OrderItemRevenueRow {
    private final String team;
    private final String category;
    private final Integer unitPrice;
    private final int quantity;

    public OrderItemRevenueRow(String team, String category, Integer unitPrice, int quantity) {
        this.team = team;
        this.category = category;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
    }

    public String getTeam() { return team; }
    public String getCategory() { return category; }
    public Integer getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
}
