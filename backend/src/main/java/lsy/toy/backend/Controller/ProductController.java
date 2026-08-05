package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.ImageUploadResponse;
import lsy.toy.backend.Dto.ProductRequest;
import lsy.toy.backend.Dto.ProductStatsResponse;
import lsy.toy.backend.Dto.UpdateProductStatusRequest;
import lsy.toy.backend.Dto.UpdateStockRequest;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Service.ProductService;
import lsy.toy.backend.Service.SupabaseStorageService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class ProductController {

    private final ProductService productService;
    private final SupabaseStorageService supabaseStorageService;

    public ProductController(ProductService productService, SupabaseStorageService supabaseStorageService) {
        this.productService = productService;
        this.supabaseStorageService = supabaseStorageService;
    }

    // 1. 상품 목록 조회 (GET)
    @GetMapping
    public List<Product> getProducts() {
        return productService.getProducts();
    }

    // 1-2. 상품 목록 페이징 조회 (GET)
    @GetMapping("/page")
    public Page<Product> getProductsPaged(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String team,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String sort
    ) {
        return productService.getProductsPaged(page, size, category, team, keyword, sort);
    }

    // 1-1. 삭제된 상품 목록 조회 (GET)
    @GetMapping("/deleted")
    public List<Product> getDeletedProducts() {
        return productService.getDeletedProducts();
    }

    // 1-3. 상품 상세 조회 (GET)
    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    // 1-4. 상품 통계 - 인기상품 TOP10/카테고리별 판매량/품절 수 (관리자 통계 페이지, GET)
    @GetMapping("/stats")
    public ProductStatsResponse getStats() {
        return productService.getStats();
    }

    // 2. 신규 상품 등록 (POST)
    @PostMapping
    public Product createProduct(@RequestBody ProductRequest request) {
        return productService.createProduct(
            request.getName(),
            request.getCategory(),
            request.getTeam(),
            request.getPrice(),
            request.getOriginalPrice(),
            request.getImageUrl(),
            request.getBadge(),
            request.getStock(),
            request.getDescription(),
            request.getDetailImageUrl()
        );
    }

    // 3. 상품 수정 (PUT)
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        return productService.updateProduct(
            id,
            request.getName(),
            request.getCategory(),
            request.getTeam(),
            request.getPrice(),
            request.getOriginalPrice(),
            request.getImageUrl(),
            request.getBadge(),
            request.getStock(),
            request.getDescription(),
            request.getDetailImageUrl()
        );
    }

    // 8. 상품 이미지 업로드 (POST) - Supabase Storage에 업로드하고 public URL을 반환한다.
    @PostMapping("/image-upload")
    public ImageUploadResponse uploadImage(@RequestParam("file") MultipartFile file) {
        return new ImageUploadResponse(supabaseStorageService.uploadProductImage(file));
    }

    // 4. 상품 삭제 (DELETE)
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
    }

    // 5. 삭제된 상품 복구 (PATCH)
    @PatchMapping("/{id}/restore")
    public Product restoreProduct(@PathVariable Long id) {
        return productService.restoreProduct(id);
    }

    // 6. 재고만 빠르게 수정 (PATCH)
    @PatchMapping("/{id}/stock")
    public Product updateStock(@PathVariable Long id, @RequestBody UpdateStockRequest request) {
        return productService.updateStock(id, request.getStock());
    }

    // 7. 판매 상태만 빠르게 수정 (PATCH)
    @PatchMapping("/{id}/status")
    public Product updateStatus(@PathVariable Long id, @RequestBody UpdateProductStatusRequest request) {
        return productService.updateStatus(id, request.getStatus());
    }
}
