package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.CategoryRequest;
import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Service.CategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // 1. 카테고리 목록 조회 (GET) - 필터/등록 폼 등에서 두루 쓰이는 공개 API라 이름만 내려준다.
    @GetMapping
    public List<String> getCategories() {
        return categoryService.getCategories().stream()
            .map(Category::getName)
            .toList();
    }

    // 2. 카테고리 관리 화면용 - id를 포함한 전체 목록 (관리자 전용)
    @GetMapping("/admin")
    public List<Category> getCategoriesForAdmin() {
        return categoryService.getCategories();
    }

    // 3. 카테고리 등록 (POST, 관리자 전용)
    @PostMapping
    public Category createCategory(@RequestBody CategoryRequest request) {
        return categoryService.createCategory(request.getName());
    }

    // 4. 카테고리 수정 (PUT, 관리자 전용)
    @PutMapping("/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(id, request.getName());
    }

    // 5. 카테고리 삭제 (DELETE, 관리자 전용)
    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }
}
