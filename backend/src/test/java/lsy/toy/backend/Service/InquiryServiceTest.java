package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AdminInquiryResponse;
import lsy.toy.backend.Dto.InquiryRequest;
import lsy.toy.backend.Dto.InquiryResponse;
import lsy.toy.backend.Entity.Inquiry;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.InquiryRepository;
import lsy.toy.backend.Repository.OrderRepository;
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
class InquiryServiceTest {

    @Mock
    private InquiryRepository inquiryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private InquiryService inquiryService;

    private User user(long id, String email) {
        User user = new User("구매자", email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Order order(long id, User owner) {
        Order order = new Order(owner, 10_000);
        ReflectionTestUtils.setField(order, "id", id);
        return order;
    }

    private InquiryRequest request(String category, Long orderId) {
        InquiryRequest request = new InquiryRequest();
        request.setCategory(category);
        request.setTitle("제목");
        request.setContent("내용");
        request.setOrderId(orderId);
        return request;
    }

    private Inquiry inquiry(User author) {
        Inquiry inquiry = new Inquiry(author, null, "상품문의", "제목", "내용", null);
        ReflectionTestUtils.setField(inquiry, "id", 1L);
        return inquiry;
    }

    @Test
    void createInquiry_올바르지않은카테고리면_400을던진다() {
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user(1L, "buyer@example.com")));

        assertThatThrownBy(() -> inquiryService.createInquiry("buyer@example.com", request("없는카테고리", null)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void createInquiry_본인의주문이아니면_403을던진다() {
        User user = user(1L, "buyer@example.com");
        User otherOwner = user(2L, "other@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order(10L, otherOwner)));

        assertThatThrownBy(() -> inquiryService.createInquiry("buyer@example.com", request("상품문의", 10L)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void createInquiry_연결할주문을찾을수없으면_404를던진다() {
        User user = user(1L, "buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inquiryService.createInquiry("buyer@example.com", request("상품문의", 10L)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void createInquiry_성공하면_문의를저장한다() {
        User user = user(1L, "buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(inquiryRepository.save(any(Inquiry.class))).thenAnswer(invocation -> {
            Inquiry saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 1L);
            return saved;
        });

        InquiryResponse response = inquiryService.createInquiry("buyer@example.com", request("상품문의", null));

        assertThat(response.getCategory()).isEqualTo("상품문의");
        assertThat(response.getStatus()).isEqualTo("답변대기");
        verify(orderRepository, never()).findById(any());
    }

    @Test
    void getInquiry_관리자가아니고본인문의가아니면_403을던진다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        assertThatThrownBy(() -> inquiryService.getInquiry(1L, "other@example.com", false))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void getInquiry_관리자는_소유권검사없이조회할수있다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        InquiryResponse response = inquiryService.getInquiry(1L, "admin@example.com", true);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void deleteInquiry_답변완료된문의는_409를던진다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        inquiry.answer("답변입니다");
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        assertThatThrownBy(() -> inquiryService.deleteInquiry(1L, "author@example.com"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));

        verify(inquiryRepository, never()).delete(any());
    }

    @Test
    void deleteInquiry_본인문의가아니면_403을던진다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        assertThatThrownBy(() -> inquiryService.deleteInquiry(1L, "other@example.com"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(403));

        verify(inquiryRepository, never()).delete(any());
    }

    @Test
    void deleteInquiry_답변대기중인본인문의는_삭제된다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        inquiryService.deleteInquiry(1L, "author@example.com");

        verify(inquiryRepository).delete(inquiry);
    }

    @Test
    void answerInquiry_답변을등록하면_상태가답변완료로바뀐다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        AdminInquiryResponse response = inquiryService.answerInquiry(1L, "  답변 내용  ");

        assertThat(response.getStatus()).isEqualTo("답변완료");
        assertThat(response.getAnswer()).isEqualTo("답변 내용");
    }

    @Test
    void answerInquiry_이미답변완료된문의는_409를던지고_기존답변을덮어쓰지않는다() {
        Inquiry inquiry = inquiry(user(1L, "author@example.com"));
        inquiry.answer("기존 답변");
        when(inquiryRepository.findById(1L)).thenReturn(Optional.of(inquiry));

        assertThatThrownBy(() -> inquiryService.answerInquiry(1L, "새 답변"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));

        assertThat(inquiry.getAnswer()).isEqualTo("기존 답변");
    }
}
