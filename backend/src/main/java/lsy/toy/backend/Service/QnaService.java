package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AdminQnaResponse;
import lsy.toy.backend.Dto.MyQnaResponse;
import lsy.toy.backend.Dto.QnaResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.Qna;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.QnaRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class QnaService {

    private final QnaRepository qnaRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public QnaService(QnaRepository qnaRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.qnaRepository = qnaRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public List<QnaResponse> getQnas(Long productId) {
        return qnaRepository.findByProduct_IdOrderByCreatedAtDesc(productId).stream()
            .map(QnaResponse::new)
            .toList();
    }

    public List<MyQnaResponse> getMyQnas(String email) {
        User user = findUser(email);
        return qnaRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
            .map(MyQnaResponse::new)
            .toList();
    }

    public List<AdminQnaResponse> getAllQnas() {
        return qnaRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(AdminQnaResponse::new)
            .toList();
    }

    @Transactional
    public QnaResponse createQna(Long productId, String email, String question) {
        String trimmedQuestion = question.trim();

        Product product = findProduct(productId);
        User user = findUser(email);

        Qna saved = qnaRepository.save(new Qna(product, user, trimmedQuestion));
        return new QnaResponse(saved);
    }

    @Transactional
    public void deleteQna(Long productId, Long qnaId, String email, boolean isAdmin) {
        Qna qna = isAdmin ? findQnaInProduct(productId, qnaId) : findOwnedQna(productId, qnaId, email);

        if (!isAdmin && !"답변대기".equals(qna.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "답변이 완료된 질문은 삭제할 수 없습니다.");
        }
        qnaRepository.delete(qna);
    }

    @Transactional
    public AdminQnaResponse answerQna(Long id, String answer) {
        String trimmed = answer.trim();
        Qna qna = findQna(id);
        if (!"답변대기".equals(qna.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 답변이 등록된 질문입니다.");
        }
        qna.answer(trimmed);
        return new AdminQnaResponse(qna);
    }

    private Qna findOwnedQna(Long productId, Long qnaId, String email) {
        Qna qna = findQnaInProduct(productId, qnaId);
        if (!qna.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 질문만 삭제할 수 있습니다.");
        }
        return qna;
    }

    private Qna findQnaInProduct(Long productId, Long qnaId) {
        Qna qna = findQna(qnaId);
        if (!qna.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "질문을 찾을 수 없습니다: " + qnaId);
        }
        return qna;
    }

    private Qna findQna(Long id) {
        return qnaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "질문을 찾을 수 없습니다: " + id));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }
}
