package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Repository.CategoryRepository;
import lsy.toy.backend.Repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category category(long id, String name) {
        Category category = new Category(name);
        ReflectionTestUtils.setField(category, "id", id);
        return category;
    }

    @Test
    void createCategory_이미존재하는이름이면_409를던진다() {
        when(categoryRepository.findByName("굿즈")).thenReturn(Optional.of(category(1L, "굿즈")));

        assertThatThrownBy(() -> categoryService.createCategory("굿즈"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void createCategory_새이름이면_앞뒤공백을잘라내어저장한다() {
        when(categoryRepository.findByName("굿즈")).thenReturn(Optional.empty());
        when(categoryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Category saved = categoryService.createCategory(" 굿즈 ");

        assertThat(saved.getName()).isEqualTo("굿즈");
    }

    @Test
    void updateCategory_존재하지않으면_404를던진다() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(1L, "굿즈"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void updateCategory_다른카테고리와이름이중복되면_409를던진다() {
        Category target = category(1L, "굿즈");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(target));
        when(categoryRepository.findByName("응원용품")).thenReturn(Optional.of(category(2L, "응원용품")));

        assertThatThrownBy(() -> categoryService.updateCategory(1L, "응원용품"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void updateCategory_이름이그대로면_중복검사없이통과한다() {
        Category target = category(1L, "굿즈");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(target));
        when(categoryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Category saved = categoryService.updateCategory(1L, "굿즈");

        assertThat(saved.getName()).isEqualTo("굿즈");
        verify(categoryRepository, never()).findByName("굿즈");
    }

    @Test
    void deleteCategory_존재하지않으면_404를던진다() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.deleteCategory(1L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void deleteCategory_사용중인카테고리면_409를던지고삭제하지않는다() {
        Category target = category(1L, "굿즈");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(target));
        when(productRepository.existsByCategory(target)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.deleteCategory(1L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void deleteCategory_사용중이아니면_삭제한다() {
        Category target = category(1L, "굿즈");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(target));
        when(productRepository.existsByCategory(target)).thenReturn(false);

        categoryService.deleteCategory(1L);

        verify(categoryRepository).delete(target);
    }
}
