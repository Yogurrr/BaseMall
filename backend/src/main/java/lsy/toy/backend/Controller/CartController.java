package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.AddCartItemRequest;
import lsy.toy.backend.Dto.CartItemResponse;
import lsy.toy.backend.Dto.UpdateCartItemRequest;
import lsy.toy.backend.Service.CartService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // 1. 내 장바구니 조회 (GET, JWT 필요)
    @GetMapping
    public List<CartItemResponse> getCart(Authentication authentication) {
        return cartService.getCart(authentication.getName());
    }

    // 2. 장바구니에 상품 담기 (POST) - 이미 있으면 수량 누적
    @PostMapping("/items")
    public List<CartItemResponse> addItem(Authentication authentication, @RequestBody AddCartItemRequest request) {
        int quantity = request.getQuantity() != null ? request.getQuantity() : 1;
        return cartService.addItem(authentication.getName(), request.getProductId(), quantity);
    }

    // 3. 특정 상품 수량 변경 (PUT)
    @PutMapping("/items/{productId}")
    public List<CartItemResponse> updateQuantity(
        Authentication authentication,
        @PathVariable Long productId,
        @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateQuantity(authentication.getName(), productId, request.getQuantity());
    }

    // 4. 특정 상품 삭제 (DELETE)
    @DeleteMapping("/items/{productId}")
    public List<CartItemResponse> removeItem(Authentication authentication, @PathVariable Long productId) {
        return cartService.removeItem(authentication.getName(), productId);
    }

    // 5. 장바구니 비우기 (DELETE, 결제 완료 시 호출)
    @DeleteMapping
    public void clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
    }
}
