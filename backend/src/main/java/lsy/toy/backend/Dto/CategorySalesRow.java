package lsy.toy.backend.Dto;

// 💡 카테고리별 누적 판매량(soldCount 합) 집계 전용 프로젝션.
public class CategorySalesRow {
    private final String category;
    private final long soldCount;

    public CategorySalesRow(String category, long soldCount) {
        this.category = category;
        this.soldCount = soldCount;
    }

    public String getCategory() { return category; }
    public long getSoldCount() { return soldCount; }
}
