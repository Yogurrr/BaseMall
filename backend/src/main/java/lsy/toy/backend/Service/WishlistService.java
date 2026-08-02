package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.WishlistItemResponse;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Entity.WishlistItem;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Repository.WishlistItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistService(
        WishlistItemRepository wishlistItemRepository,
        UserRepository userRepository,
        ProductRepository productRepository
    ) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<WishlistItemResponse> getWishlist(String email) {
        User user = findUser(email);
        return toResponses(wishlistItemRepository.findByUser_IdOrderByIdDesc(user.getId()));
    }

    public List<WishlistItemResponse> addItem(String email, Long productId) {
        User user = findUser(email);
        Product product = findProduct(productId);

        if (!wishlistItemRepository.existsByUser_IdAndProduct_Id(user.getId(), productId)) {
            wishlistItemRepository.save(new WishlistItem(user, product));
        }

        return getWishlist(email);
    }

    @Transactional
    public List<WishlistItemResponse> removeItem(String email, Long productId) {
        User user = findUser(email);
        wishlistItemRepository.deleteByUser_IdAndProduct_Id(user.getId(), productId);
        return getWishlist(email);
    }

    private List<WishlistItemResponse> toResponses(List<WishlistItem> items) {
        return items.stream()
            .map(item -> new WishlistItemResponse(item.getProduct()))
            .toList();
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
