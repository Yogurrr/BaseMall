package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AdminQnaResponse;
import lsy.toy.backend.Dto.QnaResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.Qna;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.QnaRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QnaServiceTest {

    @Mock
    private QnaRepository qnaRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private QnaService qnaService;

    private User user(long id, String email) {
        User user = new User("구매자", email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Product product(long id) {
        Product product = new Product("유니폼", null, 10_000, 10_000, 0, 0, "img.png", null);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    private Qna qna(Product product, User author) {
        Qna qna = new Qna(product, author, "질문입니다");
        ReflectionTestUtils.setField(qna, "id", 1L);
        return qna;
    }

    @Test
    void createQna_상품을찾을수없으면_404를던진다() {
        when(productRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> qnaService.createQna(10L, "buyer@example.com", "질문"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void createQna_성공하면_질문을저장한다() {
        Product product = product(10L);
        User user = user(1L, "buyer@example.com");
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(qnaRepository.save(any(Qna.class))).thenAnswer(invocation -> {
            Qna saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 1L);
            return saved;
        });

        QnaResponse response = qnaService.createQna(10L, "buyer@example.com", "  질문입니다  ");

        assertThat(response.getQuestion()).isEqualTo("질문입니다");
        assertThat(response.getStatus()).isEqualTo("답변대기");
    }

    @Test
    void deleteQna_다른상품에속한질문이면_404를던진다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Qna qna = qna(product, author);
        when(qnaRepository.findById(1L)).thenReturn(Optional.of(qna));

        assertThatThrownBy(() -> qnaService.deleteQna(99L, 1L, "author@example.com", false))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void deleteQna_본인질문이아니면_403을던진다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Qna qna = qna(product, author);
        when(qnaRepository.findById(1L)).thenReturn(Optional.of(qna));

        assertThatThrownBy(() -> qnaService.deleteQna(10L, 1L, "other@example.com", false))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));

        verify(qnaRepository, never()).delete(any());
    }

    @Test
    void deleteQna_답변완료된질문은_409를던진다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Qna qna = qna(product, author);
        qna.answer("답변입니다");
        when(qnaRepository.findById(1L)).thenReturn(Optional.of(qna));

        assertThatThrownBy(() -> qnaService.deleteQna(10L, 1L, "author@example.com", false))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));

        verify(qnaRepository, never()).delete(any());
    }

    @Test
    void deleteQna_관리자는_답변완료된질문도삭제할수있다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Qna qna = qna(product, author);
        qna.answer("답변입니다");
        when(qnaRepository.findById(1L)).thenReturn(Optional.of(qna));

        qnaService.deleteQna(10L, 1L, "admin@example.com", true);

        verify(qnaRepository).delete(qna);
    }

    @Test
    void answerQna_답변을등록하면_상태가답변완료로바뀐다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Qna qna = qna(product, author);
        when(qnaRepository.findById(1L)).thenReturn(Optional.of(qna));

        AdminQnaResponse response = qnaService.answerQna(1L, "  답변 내용  ");

        assertThat(response.getStatus()).isEqualTo("답변완료");
        assertThat(response.getAnswer()).isEqualTo("답변 내용");
    }

    @Test
    void answerQna_이미답변완료된질문은_409를던지고_기존답변을덮어쓰지않는다() {
        Product product = product(10L);
        User author = user(1L, "author@example.com");
        Qna qna = qna(product, author);
        qna.answer("기존 답변");
        when(qnaRepository.findById(1L)).thenReturn(Optional.of(qna));

        assertThatThrownBy(() -> qnaService.answerQna(1L, "새 답변"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));

        assertThat(qna.getAnswer()).isEqualTo("기존 답변");
    }
}
