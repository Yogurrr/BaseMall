package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.PointTransactionResponse;
import lsy.toy.backend.Entity.PointTransaction;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.PointTransactionRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @InjectMocks
    private PointService pointService;

    private User userWithPoints(int points) {
        User user = new User("구매자", "buyer@example.com");
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setPoints(points);
        return user;
    }

    @Test
    void record_금액이0이면_아무것도하지않는다() {
        User user = userWithPoints(1_000);

        pointService.record(user, 0, "ORDER_EARN", null, null, "설명");

        assertThat(user.getPoints()).isEqualTo(1_000);
        verify(userRepository, never()).save(any());
        verify(pointTransactionRepository, never()).save(any());
    }

    @Test
    void record_양수금액이면_적립금이증가하고_이력이남는다() {
        User user = userWithPoints(1_000);

        pointService.record(user, 500, "ORDER_EARN", null, null, "적립");

        assertThat(user.getPoints()).isEqualTo(1_500);
        verify(userRepository).save(user);
        verify(pointTransactionRepository).save(any(PointTransaction.class));
    }

    @Test
    void record_음수금액이면_적립금이차감된다() {
        User user = userWithPoints(1_000);

        pointService.record(user, -300, "ORDER_USE", null, null, "사용");

        assertThat(user.getPoints()).isEqualTo(700);
    }

    @Test
    void getMyTransactions_존재하지않는사용자면_404를던진다() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pointService.getMyTransactions("ghost@example.com"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void getMyTransactions_적립금이력을반환한다() {
        User user = userWithPoints(1_000);
        PointTransaction transaction = new PointTransaction(user, 500, "ORDER_EARN", null, null, "적립");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(pointTransactionRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(transaction));

        List<PointTransactionResponse> result = pointService.getMyTransactions("buyer@example.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAmount()).isEqualTo(500);
    }
}
