package lsy.toy.backend.Controller;

import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Service.CategoryService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // 카테고리 목록 조회 (GET)
    @GetMapping
    public List<String> getCategories() {
        return categoryService.getCategories().stream()
            .map(Category::getName)
            .toList();
    }
}
