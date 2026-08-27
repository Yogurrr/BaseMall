package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Badge;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Repository.BadgeRepository;
import lsy.toy.backend.Repository.ProductRepository;
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
class BadgeServiceTest {

    @Mock
    private BadgeRepository badgeRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private BadgeService badgeService;

    private Badge badge(long id, String name, String colorFrom, String colorTo) {
        Badge badge = new Badge(name, colorFrom, colorTo);
        ReflectionTestUtils.setField(badge, "id", id);
        return badge;
    }

    @Test
    void createBadge_이미존재하는이름이면_409를던진다() {
        when(badgeRepository.existsByName("NEW")).thenReturn(true);

        assertThatThrownBy(() -> badgeService.createBadge("NEW", "#fff", "#000"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
        verify(badgeRepository, never()).save(any());
    }

    @Test
    void createBadge_새이름이면_앞뒤공백을잘라내어저장한다() {
        when(badgeRepository.existsByName("NEW")).thenReturn(false);
        when(badgeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Badge saved = badgeService.createBadge(" NEW ", " #fff ", " #000 ");

        assertThat(saved.getName()).isEqualTo("NEW");
        assertThat(saved.getColorFrom()).isEqualTo("#fff");
        assertThat(saved.getColorTo()).isEqualTo("#000");
    }

    @Test
    void updateBadge_존재하지않으면_404를던진다() {
        when(badgeRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> badgeService.updateBadge(1L, "NEW", "#fff", "#000"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void updateBadge_이름을다른뱃지와중복되게바꾸면_409를던지고상품은건드리지않는다() {
        Badge target = badge(1L, "NEW", "#fff", "#000");
        when(badgeRepository.findById(1L)).thenReturn(Optional.of(target));
        when(badgeRepository.existsByName("SALE")).thenReturn(true);

        assertThatThrownBy(() -> badgeService.updateBadge(1L, "SALE", "#fff", "#000"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
        verify(productRepository, never()).findByBadge(any());
    }

    @Test
    void updateBadge_이름이바뀌면_해당이름을쓰던상품들의badge를함께바꾼다() {
        Badge target = badge(1L, "NEW", "#fff", "#000");
        Product product = new Product("상품", null, 1000, 1000, 0, 0, "img.jpg", "NEW");
        when(badgeRepository.findById(1L)).thenReturn(Optional.of(target));
        when(badgeRepository.existsByName("BEST")).thenReturn(false);
        when(productRepository.findByBadge("NEW")).thenReturn(List.of(product));
        when(badgeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Badge saved = badgeService.updateBadge(1L, "BEST", "#111", "#222");

        assertThat(saved.getName()).isEqualTo("BEST");
        assertThat(product.getBadge()).isEqualTo("BEST");
        verify(productRepository).saveAll(List.of(product));
    }

    @Test
    void updateBadge_이름이그대로면_중복검사나상품갱신없이색상만바꾼다() {
        Badge target = badge(1L, "NEW", "#fff", "#000");
        when(badgeRepository.findById(1L)).thenReturn(Optional.of(target));
        when(badgeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Badge saved = badgeService.updateBadge(1L, "NEW", "#111", "#222");

        assertThat(saved.getColorFrom()).isEqualTo("#111");
        assertThat(saved.getColorTo()).isEqualTo("#222");
        verify(badgeRepository, never()).existsByName(any());
        verify(productRepository, never()).findByBadge(any());
    }

    @Test
    void deleteBadge_존재하지않으면_404를던진다() {
        when(badgeRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> badgeService.deleteBadge(1L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
        verify(badgeRepository, never()).delete(any());
    }

    @Test
    void deleteBadge_해당뱃지를쓰던상품들의badge를비우고삭제한다() {
        Badge target = badge(1L, "NEW", "#fff", "#000");
        Product product = new Product("상품", null, 1000, 1000, 0, 0, "img.jpg", "NEW");
        when(badgeRepository.findById(1L)).thenReturn(Optional.of(target));
        when(productRepository.findByBadge("NEW")).thenReturn(List.of(product));

        badgeService.deleteBadge(1L);

        assertThat(product.getBadge()).isNull();
        ArgumentCaptor<Badge> captor = ArgumentCaptor.forClass(Badge.class);
        verify(badgeRepository).delete(captor.capture());
        assertThat(captor.getValue()).isEqualTo(target);
        verify(productRepository).saveAll(List.of(product));
    }
}
