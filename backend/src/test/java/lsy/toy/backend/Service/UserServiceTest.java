package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.MemberStatsResponse;
import lsy.toy.backend.Dto.UserDetailResponse;
import lsy.toy.backend.Dto.UserSpendRow;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.OrderRepository;
import lsy.toy.backend.Repository.UserRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private UserService userService;

    private User user(long id, String role) {
        User user = new User("회원" + id, "user" + id + "@example.com");
        ReflectionTestUtils.setField(user, "id", id);
        ReflectionTestUtils.setField(user, "role", role);
        return user;
    }

    @Test
    void getMemberGrade_구매금액구간에따라등급이달라진다() {
        when(orderRepository.sumSpendByUserId(1L)).thenReturn(0L);
        when(orderRepository.sumSpendByUserId(2L)).thenReturn(50_000L);
        when(orderRepository.sumSpendByUserId(3L)).thenReturn(200_000L);
        when(orderRepository.sumSpendByUserId(4L)).thenReturn(500_000L);

        assertThat(userService.getMemberGrade(1L)).isEqualTo("Rookie");
        assertThat(userService.getMemberGrade(2L)).isEqualTo("Starter");
        assertThat(userService.getMemberGrade(3L)).isEqualTo("All-Star");
        assertThat(userService.getMemberGrade(4L)).isEqualTo("MVP");
    }

    @Test
    void getMemberGrade_주문이력이없으면_Rookie다() {
        when(orderRepository.sumSpendByUserId(1L)).thenReturn(null);

        assertThat(userService.getMemberGrade(1L)).isEqualTo("Rookie");
    }

    @Test
    void getUserDetail_존재하지않으면_404를던진다() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserDetail(999L))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void getUserDetail_관리자면_등급이null이다() {
        User admin = user(1L, "ADMIN");
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        UserDetailResponse detail = userService.getUserDetail(1L);

        assertThat(detail.getGrade()).isNull();
    }

    @Test
    void getUserDetail_일반회원이면_등급을계산한다() {
        User member = user(2L, "USER");
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        when(orderRepository.sumSpendByUserId(2L)).thenReturn(200_000L);

        UserDetailResponse detail = userService.getUserDetail(2L);

        assertThat(detail.getGrade()).isEqualTo("All-Star");
    }

    @Test
    void getStats_지출이력이없는활성회원은_Rookie로집계된다() {
        User active = user(1L, "USER");
        when(userRepository.findByUseAt("Y")).thenReturn(List.of(active));
        when(orderRepository.findSpendByUser()).thenReturn(List.of());

        MemberStatsResponse stats = userService.getStats();

        assertThat(stats.getGradeDistribution())
            .filteredOn(g -> g.getGrade().equals("Rookie"))
            .extracting(g -> g.getCount())
            .containsExactly(1L);
    }

    @Test
    void getStats_지출금액이있으면_해당등급으로집계된다() {
        User bigSpender = user(1L, "USER");
        when(userRepository.findByUseAt("Y")).thenReturn(List.of(bigSpender));
        when(orderRepository.findSpendByUser()).thenReturn(List.of(new UserSpendRow(1L, 500_000L)));

        MemberStatsResponse stats = userService.getStats();

        assertThat(stats.getGradeDistribution())
            .filteredOn(g -> g.getGrade().equals("MVP"))
            .extracting(g -> g.getCount())
            .containsExactly(1L);
    }
}
