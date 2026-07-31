package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.CartItemResponse;
import lsy.toy.backend.Entity.CartItem;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartService(
        CartItemRepository cartItemRepository,
        UserRepository userRepository,
        ProductRepository productRepository
    ) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<CartItemResponse> getCart(String email) {
        User user = findUser(email);
        return toResponses(cartItemRepository.findByUser_IdOrderByIdAsc(user.getId()));
    }

    public List<CartItemResponse> addItem(String email, Long productId, int quantity) {
        User user = findUser(email);
        Product product = findProduct(productId);

        CartItem item = cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), productId)
            .orElseGet(() -> new CartItem(user, product, 0));
        item.setQuantity(clampQuantity(item.getQuantity() + quantity));
        cartItemRepository.save(item);

        return getCart(email);
    }

    public List<CartItemResponse> updateQuantity(String email, Long productId, int quantity) {
        User user = findUser(email);
        CartItem item = cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "장바구니에 없는 상품입니다: " + productId));

        item.setQuantity(clampQuantity(quantity));
        cartItemRepository.save(item);

        return getCart(email);
    }

    public List<CartItemResponse> removeItem(String email, Long productId) {
        User user = findUser(email);
        cartItemRepository.deleteByUser_IdAndProduct_Id(user.getId(), productId);
        return getCart(email);
    }

    public void clearCart(String email) {
        User user = findUser(email);
        cartItemRepository.deleteByUser_Id(user.getId());
    }

    private int clampQuantity(int quantity) {
        return Math.max(1, Math.min(99, quantity));
    }

    private List<CartItemResponse> toResponses(List<CartItem> items) {
        return items.stream()
            .map(item -> new CartItemResponse(item.getProduct(), item.getQuantity()))
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
