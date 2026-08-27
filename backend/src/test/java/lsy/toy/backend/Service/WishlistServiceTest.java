package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.WishlistItemResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Entity.WishlistItem;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Repository.WishlistItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistItemRepository wishlistItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private WishlistService wishlistService;

    private User user(long id, String email) {
        User user = new User("회원", email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Product product(long id) {
        Product product = new Product("상품", null, 1000, 1000, 0, 0, "img.jpg", null);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    @Test
    void getWishlist_존재하지않는사용자면_404를던진다() {
        when(userRepository.findByEmail("noone@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.getWishlist("noone@example.com"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void addItem_존재하지않는상품이면_404를던진다() {
        User user = user(1L, "user@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.addItem("user@example.com", 10L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void addItem_이미담겨있으면_다시저장하지않는다() {
        User user = user(1L, "user@example.com");
        Product product = product(10L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistItemRepository.existsByUser_IdAndProduct_Id(1L, 10L)).thenReturn(true);
        when(wishlistItemRepository.findByUser_IdOrderByIdDesc(1L)).thenReturn(List.of());

        wishlistService.addItem("user@example.com", 10L);

        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void addItem_담겨있지않으면_새로저장한다() {
        User user = user(1L, "user@example.com");
        Product product = product(10L);
        WishlistItem saved = new WishlistItem(user, product);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistItemRepository.existsByUser_IdAndProduct_Id(1L, 10L)).thenReturn(false);
        when(wishlistItemRepository.findByUser_IdOrderByIdDesc(1L)).thenReturn(List.of(saved));

        List<WishlistItemResponse> result = wishlistService.addItem("user@example.com", 10L);

        verify(wishlistItemRepository).save(any(WishlistItem.class));
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
    }

    @Test
    void removeItem_삭제후남은목록을반환한다() {
        User user = user(1L, "user@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(wishlistItemRepository.findByUser_IdOrderByIdDesc(1L)).thenReturn(List.of());

        List<WishlistItemResponse> result = wishlistService.removeItem("user@example.com", 10L);

        verify(wishlistItemRepository).deleteByUser_IdAndProduct_Id(1L, 10L);
        assertThat(result).isEmpty();
    }
}
