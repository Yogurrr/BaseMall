package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.PointTransactionResponse;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.PointTransaction;
import lsy.toy.backend.Entity.Review;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.PointTransactionRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// 💡 User.points 잔액 변경과 그 이력(point_transactions) 기록을 항상 같이 묶어서 처리하기 위한 공용 서비스.
// OrderService(주문 적립/사용/취소)와 ReviewService(리뷰 적립)가 공유한다.
@Service
public class PointService {

    private final UserRepository userRepository;
    private final PointTransactionRepository pointTransactionRepository;

    public PointService(UserRepository userRepository, PointTransactionRepository pointTransactionRepository) {
        this.userRepository = userRepository;
        this.pointTransactionRepository = pointTransactionRepository;
    }

    @Transactional
    public void record(User user, int amount, String type, Order order, Review review, String description) {
        if (amount == 0) {
            return;
        }
        user.setPoints(user.getPoints() + amount);
        userRepository.save(user);
        pointTransactionRepository.save(new PointTransaction(user, amount, type, order, review, description));
    }

    public List<PointTransactionResponse> getMyTransactions(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
        return pointTransactionRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
            .map(PointTransactionResponse::new)
            .toList();
    }
}
