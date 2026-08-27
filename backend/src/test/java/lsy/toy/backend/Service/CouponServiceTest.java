package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CouponRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserService userService;

    @InjectMocks
    private CouponService couponService;

    private User user(long id, String email) {
        User user = new User("회원", email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    @Test
    void issueByGrade_존재하지않는등급이면_400을던진다() {
        assertThatThrownBy(() -> couponService.issueByGrade("일반회원"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void issueByGrade_해당등급이면서_미사용쿠폰이없는회원에게만_발급한다() {
        User matching = user(1L, "vip@example.com");
        User otherGrade = user(2L, "rookie@example.com");
        when(userService.getUsers()).thenReturn(List.of(matching, otherGrade));
        when(userService.getMemberGrade(1L)).thenReturn("MVP");
        when(userService.getMemberGrade(2L)).thenReturn("Rookie");
        when(couponRepository.existsByUser_IdAndGradeAndUsedAtIsNull(1L, "MVP")).thenReturn(false);

        int issuedCount = couponService.issueByGrade("MVP");

        assertThat(issuedCount).isEqualTo(1);
        ArgumentCaptor<lsy.toy.backend.Entity.Coupon> captor = ArgumentCaptor.forClass(lsy.toy.backend.Entity.Coupon.class);
        verify(couponRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(matching);
        assertThat(captor.getValue().getDiscountPercent()).isEqualTo(12);
    }

    @Test
    void issueByGrade_이미같은등급의미사용쿠폰이있으면_발급하지않는다() {
        User matching = user(1L, "vip@example.com");
        when(userService.getUsers()).thenReturn(List.of(matching));
        when(userService.getMemberGrade(1L)).thenReturn("MVP");
        when(couponRepository.existsByUser_IdAndGradeAndUsedAtIsNull(1L, "MVP")).thenReturn(true);

        int issuedCount = couponService.issueByGrade("MVP");

        assertThat(issuedCount).isEqualTo(0);
        verify(couponRepository, never()).save(any());
    }

    @Test
    void issueByGrade_대상회원이없으면_0을반환한다() {
        when(userService.getUsers()).thenReturn(List.of());

        int issuedCount = couponService.issueByGrade("Rookie");

        assertThat(issuedCount).isEqualTo(0);
        verify(couponRepository, never()).save(any());
    }
}
