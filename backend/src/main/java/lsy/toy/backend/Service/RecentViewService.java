package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.RecentViewItemResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.RecentViewItem;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.RecentViewItemRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class RecentViewService {

    private final RecentViewItemRepository recentViewItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public RecentViewService(
        RecentViewItemRepository recentViewItemRepository,
        UserRepository userRepository,
        ProductRepository productRepository
    ) {
        this.recentViewItemRepository = recentViewItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<RecentViewItemResponse> getRecentViews(String email) {
        User user = findUser(email);
        return recentViewItemRepository.findTop30ByUser_IdOrderByViewedAtDesc(user.getId()).stream()
            .map(item -> new RecentViewItemResponse(item.getProduct(), item.getViewedAt()))
            .toList();
    }

    // 💡 같은 상품을 다시 보면 새 행을 쌓지 않고 viewedAt만 갱신해 목록 맨 앞으로 올라오게 한다.
    // 이미 본 상품이면(대부분의 재방문 케이스) 상품 조회 없이 viewedAt만 갱신해 쿼리를 아낀다.
    @Transactional
    public void recordView(String email, Long productId) {
        User user = findUser(email);

        RecentViewItem item = recentViewItemRepository.findByUser_IdAndProduct_Id(user.getId(), productId)
            .orElseGet(() -> new RecentViewItem(user, findProduct(productId), null));
        item.setViewedAt(Instant.now());
        recentViewItemRepository.save(item);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다: " + id));
    }
}
