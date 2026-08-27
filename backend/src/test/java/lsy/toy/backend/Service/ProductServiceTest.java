package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Repository.CategoryRepository;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TeamRepository teamRepository;

    @InjectMocks
    private ProductService productService;

    private Product product(int stock, String status) {
        Product product = new Product("유니폼", new Category("유니폼"), 10_000, 10_000, 0, 0, "img.png", null);
        ReflectionTestUtils.setField(product, "id", 1L);
        product.setStock(stock);
        product.setStatus(status);
        return product;
    }

    @Test
    void getProductsPaged_할인순정렬이면_전용쿼리를호출한다() {
        Page<Product> page = new PageImpl<>(List.of());
        when(productRepository.searchOrderByDiscountDesc(isNull(), isNull(), isNull(), any(Pageable.class)))
            .thenReturn(page);

        productService.getProductsPaged(0, 10, null, null, null, "discount");

        verify(productRepository).searchOrderByDiscountDesc(isNull(), isNull(), isNull(), any(Pageable.class));
        verify(productRepository, never()).search(any(), any(), any(), any());
    }

    @Test
    void getProductsPaged_가격순정렬이면_일반검색쿼리를_해당Sort로호출한다() {
        Page<Product> page = new PageImpl<>(List.of());
        when(productRepository.search(isNull(), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        productService.getProductsPaged(0, 10, null, null, null, "priceAsc");

        Pageable expected = PageRequest.of(0, 10, Sort.by("price").ascending());
        verify(productRepository).search(isNull(), isNull(), isNull(), eq(expected));
    }

    @Test
    void createProduct_존재하지않는카테고리면_400을던진다() {
        when(categoryRepository.findByName("없는카테고리")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(
            "상품", "없는카테고리", null, 1000, 1000, "img.png", null, 10, "설명", null))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void updateStatus_올바르지않은상태값이면_400을던진다() {
        assertThatThrownBy(() -> productService.updateStatus(1L, "존재안함"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void updateStatus_재고가없는데판매중으로변경하면_400을던진다() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product(0, "품절")));

        assertThatThrownBy(() -> productService.updateStatus(1L, "판매중"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void updateStatus_재고가있으면_판매중으로변경된다() {
        Product product = product(5, "품절");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product result = productService.updateStatus(1L, "판매중");

        assertThat(result.getStatus()).isEqualTo("판매중");
    }

    @Test
    void deleteProduct_실제로지우지않고_useAt을N으로바꾼다() {
        Product product = product(5, "판매중");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.deleteProduct(1L);

        assertThat(product.getUseAt()).isEqualTo("N");
    }

    @Test
    void restoreProduct_useAt을Y로복원한다() {
        Product product = product(5, "판매중");
        product.setUseAt("N");
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.restoreProduct(1L);

        assertThat(product.getUseAt()).isEqualTo("Y");
    }

    @Test
    void getProduct_존재하지않으면_404를던진다() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProduct(999L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }
}
