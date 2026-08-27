package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.CartItemResponse;
import lsy.toy.backend.Entity.CartItem;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class CartServiceTest {

    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private User user() {
        User user = new User("구매자", "buyer@example.com");
        ReflectionTestUtils.setField(user, "id", 1L);
        return user;
    }

    private Product product() {
        Product product = new Product("유니폼", null, 10_000, 10_000, 0, 0, "img.png", null);
        ReflectionTestUtils.setField(product, "id", 100L);
        return product;
    }

    @Test
    void addItem_기존항목이없으면_새로담는다() {
        User user = user();
        Product product = product();
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findMatchingItem(1L, 100L, "L", null)).thenReturn(Optional.empty());
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of());

        cartService.addItem("buyer@example.com", 100L, 2, "L", null);

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(2);
    }

    @Test
    void addItem_기존항목이있으면_수량을더한다() {
        User user = user();
        Product product = product();
        CartItem existing = new CartItem(user, product, 3, null, null);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findMatchingItem(1L, 100L, null, null)).thenReturn(Optional.of(existing));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of());

        cartService.addItem("buyer@example.com", 100L, 5, null, null);

        assertThat(existing.getQuantity()).isEqualTo(8);
    }

    @Test
    void addItem_수량이99를넘으면_99로제한한다() {
        User user = user();
        Product product = product();
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findMatchingItem(1L, 100L, null, null)).thenReturn(Optional.empty());
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of());

        cartService.addItem("buyer@example.com", 100L, 999, null, null);

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(99);
    }

    @Test
    void updateQuantity_0이하로수정하면_1로보정한다() {
        User user = user();
        CartItem item = new CartItem(user, product(), 5, null, null);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByIdAndUser_Id(10L, 1L)).thenReturn(Optional.of(item));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of());

        cartService.updateQuantity("buyer@example.com", 10L, 0);

        assertThat(item.getQuantity()).isEqualTo(1);
    }

    @Test
    void updateQuantity_존재하지않는카트항목이면_404를던진다() {
        User user = user();
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByIdAndUser_Id(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.updateQuantity("buyer@example.com", 10L, 5))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));

        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void getCart_존재하지않는사용자면_404를던진다() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.getCart("ghost@example.com"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void getCart_담긴상품목록을반환한다() {
        User user = user();
        CartItem item = new CartItem(user, product(), 2, null, null);
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(cartItemRepository.findByUser_IdOrderByIdAsc(1L)).thenReturn(List.of(item));

        List<CartItemResponse> cart = cartService.getCart("buyer@example.com");

        assertThat(cart).hasSize(1);
        assertThat(cart.get(0).getQuantity()).isEqualTo(2);
    }
}
