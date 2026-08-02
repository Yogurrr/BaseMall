package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.Team;
import lsy.toy.backend.Repository.CategoryRepository;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.TeamRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class ProductService {

    private static final Set<String> PRODUCT_STATUSES = Set.of("판매중", "판매중지", "품절");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final TeamRepository teamRepository;

    public ProductService(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        TeamRepository teamRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.teamRepository = teamRepository;
    }

    public List<Product> getProducts() {
        return productRepository.findByUseAt("Y");
    }

    public Page<Product> getProductsPaged(int page, int size, String category, String team, String keyword, String sort) {
        String normalizedKeyword = blankToNull(keyword);
        String normalizedCategory = blankToNull(category);
        String normalizedTeam = blankToNull(team);

        // 💡 할인율은 계산값이라 Sort로 표현할 수 없어 ORDER BY가 박힌 전용 쿼리를 따로 탄다.
        if ("discount".equals(sort)) {
            return productRepository.searchOrderByDiscountDesc(
                normalizedKeyword, normalizedCategory, normalizedTeam, PageRequest.of(page, size)
            );
        }

        Pageable pageable = PageRequest.of(page, size, resolveSort(sort));
        return productRepository.search(normalizedKeyword, normalizedCategory, normalizedTeam, pageable);
    }

    // 💡 인기순/판매순은 같은 누적 판매 수량(soldCount) 기준 — 사용자 입장에서는 다른 옵션이지만
    // 현재는 동일한 데이터로 정렬한다.
    private Sort resolveSort(String sort) {
        if (sort == null) return Sort.unsorted();
        return switch (sort) {
            case "priceAsc" -> Sort.by("price").ascending();
            case "priceDesc" -> Sort.by("price").descending();
            case "reviews" -> Sort.by("reviewCount").descending();
            case "popular", "sales" -> Sort.by("soldCount").descending();
            case "newest" -> Sort.by("createdAt").descending();
            default -> Sort.unsorted();
        };
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    public List<Product> getDeletedProducts() {
        return productRepository.findByUseAt("N");
    }

    public Product getProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));
    }

    public Product createProduct(
        String name, String categoryName, String teamName, Integer price, Integer originalPrice, String emoji, String badge, Integer stock
    ) {
        Product product = new Product(name, findCategory(categoryName), price, originalPrice, 0, 0, emoji, badge);
        product.setTeam(findTeam(teamName));
        product.setStock(validateStock(stock));
        return productRepository.save(product);
    }

    public Product updateProduct(
        Long id, String name, String categoryName, String teamName, Integer price, Integer originalPrice, String emoji, String badge, Integer stock
    ) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));

        product.setName(name);
        product.setCategory(findCategory(categoryName));
        product.setTeam(findTeam(teamName));
        product.setPrice(price);
        product.setOriginalPrice(originalPrice);
        product.setEmoji(emoji);
        product.setBadge(badge);
        product.setStock(validateStock(stock));

        return productRepository.save(product);
    }

    public Product updateStock(Long id, Integer stock) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));

        product.setStock(validateStock(stock));
        return productRepository.save(product);
    }

    private int validateStock(Integer stock) {
        if (stock == null || stock < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "재고는 0 이상이어야 합니다.");
        }
        return stock;
    }

    public Product updateStatus(Long id, String status) {
        if (status == null || !PRODUCT_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 상품 상태입니다: " + status);
        }

        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));

        if ("판매중".equals(status) && product.getStock() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "재고가 없어 판매중으로 변경할 수 없습니다.");
        }

        product.setStatus(status);
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));

        // 💡 실제로 행을 지우지 않고 use_at을 'N'으로 바꾸는 소프트 삭제
        product.setUseAt("N");
        productRepository.save(product);
    }

    public Product restoreProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));

        product.setUseAt("Y");
        return productRepository.save(product);
    }

    private Category findCategory(String categoryName) {
        return categoryRepository.findByName(categoryName)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 카테고리입니다: " + categoryName));
    }

    private Team findTeam(String teamName) {
        if (teamName == null || teamName.isBlank()) {
            return null;
        }
        return teamRepository.findByName(teamName)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 구단입니다: " + teamName));
    }
}
