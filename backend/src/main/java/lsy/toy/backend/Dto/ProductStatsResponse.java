package lsy.toy.backend.Dto;

import java.util.List;

public class ProductStatsResponse {
    private final List<ProductRankRow> topProducts;
    private final List<CategorySalesRow> categorySales;
    private final long outOfStockCount;

    public ProductStatsResponse(List<ProductRankRow> topProducts, List<CategorySalesRow> categorySales, long outOfStockCount) {
        this.topProducts = topProducts;
        this.categorySales = categorySales;
        this.outOfStockCount = outOfStockCount;
    }

    public List<ProductRankRow> getTopProducts() { return topProducts; }
    public List<CategorySalesRow> getCategorySales() { return categorySales; }
    public long getOutOfStockCount() { return outOfStockCount; }
}
