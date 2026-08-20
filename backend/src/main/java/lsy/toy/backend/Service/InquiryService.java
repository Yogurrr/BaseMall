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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class InquiryService {

    private static final Set<String> VALID_CATEGORIES = Set.of("상품문의", "배송문의", "교환/환불", "결제/주문", "기타");

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public InquiryService(InquiryRepository inquiryRepository, UserRepository userRepository, OrderRepository orderRepository) {
        this.inquiryRepository = inquiryRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public InquiryResponse createInquiry(String email, InquiryRequest request) {
        User user = findUser(email);
        String category = validateCategory(request.getCategory());
        String title = validateNotBlank(request.getTitle(), "제목을 입력해주세요.");
        String content = validateNotBlank(request.getContent(), "내용을 입력해주세요.");
        Order order = resolveOwnedOrder(request.getOrderId(), user);

        Inquiry saved = inquiryRepository.save(new Inquiry(user, order, category, title, content, request.getImageUrl()));
        return new InquiryResponse(saved);
    }

    public List<InquiryResponse> getMyInquiries(String email) {
        User user = findUser(email);
        return inquiryRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
            .map(InquiryResponse::new)
            .toList();
    }

    public InquiryResponse getInquiry(Long id, String email, boolean isAdmin) {
        Inquiry inquiry = isAdmin ? findInquiry(id) : findOwnedInquiry(id, email);
        return new InquiryResponse(inquiry);
    }

    public List<AdminInquiryResponse> getAllInquiries() {
        return inquiryRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(AdminInquiryResponse::new)
            .toList();
    }

    @Transactional
    public void deleteInquiry(Long id, String email) {
        Inquiry inquiry = findOwnedInquiry(id, email);
        if (!"답변대기".equals(inquiry.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "답변이 완료된 문의는 삭제할 수 없습니다.");
        }
        inquiryRepository.delete(inquiry);
    }

    @Transactional
    public AdminInquiryResponse answerInquiry(Long id, String answer) {
        String trimmed = validateNotBlank(answer, "답변 내용을 입력해주세요.");
        Inquiry inquiry = findInquiry(id);
        inquiry.answer(trimmed);
        return new AdminInquiryResponse(inquiry);
    }

    private Order resolveOwnedOrder(Long orderId, User user) {
        if (orderId == null) {
            return null;
        }
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다: " + orderId));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 주문만 문의에 연결할 수 있습니다.");
        }
        return order;
    }

    private Inquiry findOwnedInquiry(Long id, String email) {
        Inquiry inquiry = findInquiry(id);
        if (!inquiry.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 문의만 조회/삭제할 수 있습니다.");
        }
        return inquiry;
    }

    private Inquiry findInquiry(Long id) {
        return inquiryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다: " + id));
    }

    private String validateCategory(String category) {
        if (category == null || !VALID_CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 카테고리를 선택해주세요.");
        }
        return category;
    }

    private String validateNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }
}
