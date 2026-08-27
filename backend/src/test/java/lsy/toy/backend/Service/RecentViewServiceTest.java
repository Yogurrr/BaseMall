package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.RecentViewItemResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.RecentViewItem;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.RecentViewItemRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecentViewServiceTest {

    @Mock
    private RecentViewItemRepository recentViewItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private RecentViewService recentViewService;

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
    void getRecentViews_존재하지않는사용자면_404를던진다() {
        when(userRepository.findByEmail("noone@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recentViewService.getRecentViews("noone@example.com"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void getRecentViews_최근30개를viewedAt과함께반환한다() {
        User user = user(1L, "user@example.com");
        Product product = product(10L);
        Instant viewedAt = Instant.now();
        RecentViewItem item = new RecentViewItem(user, product, viewedAt);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(recentViewItemRepository.findRecentByUserId(any(Long.class), any(Pageable.class)))
            .thenReturn(List.of(item));

        List<RecentViewItemResponse> result = recentViewService.getRecentViews("user@example.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
        assertThat(result.get(0).getViewedAt()).isEqualTo(viewedAt);
    }

    @Test
    void recordView_존재하지않는상품이면_404를던진다() {
        User user = user(1L, "user@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(recentViewItemRepository.findByUser_IdAndProduct_Id(1L, 10L)).thenReturn(Optional.empty());
        when(productRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recentViewService.recordView("user@example.com", 10L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
        verify(recentViewItemRepository, never()).save(any());
    }

    @Test
    void recordView_처음보는상품이면_새행을만들어저장한다() {
        User user = user(1L, "user@example.com");
        Product product = product(10L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(recentViewItemRepository.findByUser_IdAndProduct_Id(1L, 10L)).thenReturn(Optional.empty());
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(recentViewItemRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        recentViewService.recordView("user@example.com", 10L);

        ArgumentCaptor<RecentViewItem> captor = ArgumentCaptor.forClass(RecentViewItem.class);
        verify(recentViewItemRepository).save(captor.capture());
        assertThat(captor.getValue().getProduct()).isEqualTo(product);
        assertThat(captor.getValue().getViewedAt()).isNotNull();
    }

    @Test
    void recordView_이미본상품이면_새행을만들지않고viewedAt만갱신한다() {
        User user = user(1L, "user@example.com");
        Product product = product(10L);
        RecentViewItem existing = new RecentViewItem(user, product, Instant.now().minusSeconds(3600));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(recentViewItemRepository.findByUser_IdAndProduct_Id(1L, 10L)).thenReturn(Optional.of(existing));
        when(recentViewItemRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Instant before = existing.getViewedAt();
        recentViewService.recordView("user@example.com", 10L);

        verify(productRepository, never()).findById(any());
        verify(recentViewItemRepository).save(existing);
        assertThat(existing.getViewedAt()).isAfter(before);
    }
}
