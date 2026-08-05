package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Repository.CategoryRepository;
import lsy.toy.backend.Repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(String name) {
        String trimmedName = requireName(name);
        if (categoryRepository.findByName(trimmedName).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 카테고리입니다: " + trimmedName);
        }

        Category saved = categoryRepository.save(new Category(trimmedName));
        log.info("카테고리 등록: categoryId={}, name={}", saved.getId(), saved.getName());
        return saved;
    }

    public Category updateCategory(Long id, String name) {
        Category category = findCategory(id);
        String trimmedName = requireName(name);

        if (!trimmedName.equals(category.getName()) && categoryRepository.findByName(trimmedName).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 카테고리입니다: " + trimmedName);
        }

        category.setName(trimmedName);
        Category saved = categoryRepository.save(category);
        log.info("카테고리 수정: categoryId={}, name={}", saved.getId(), saved.getName());
        return saved;
    }

    public void deleteCategory(Long id) {
        Category category = findCategory(id);

        if (productRepository.existsByCategory(category)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "사용 중인 카테고리는 삭제할 수 없습니다: " + category.getName());
        }

        categoryRepository.delete(category);
        log.info("카테고리 삭제: categoryId={}, name={}", id, category.getName());
    }

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리 이름을 입력해주세요.");
        }
        return name.trim();
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다: " + id));
    }
}
