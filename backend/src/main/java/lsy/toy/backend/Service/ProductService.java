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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductService {

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

    public Page<Product> getProductsPaged(int page, int size, String category, String team, String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.search(blankToNull(keyword), blankToNull(category), blankToNull(team), pageable);
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
        String name, String categoryName, String teamName, Integer price, Integer originalPrice, String emoji, String badge
    ) {
        Product product = new Product(name, findCategory(categoryName), price, originalPrice, 0, 0, emoji, badge);
        product.setTeam(findTeam(teamName));
        return productRepository.save(product);
    }

    public Product updateProduct(
        Long id, String name, String categoryName, String teamName, Integer price, Integer originalPrice, String emoji, String badge
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
