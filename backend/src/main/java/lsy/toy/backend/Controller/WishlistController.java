package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.AddWishlistItemRequest;
import lsy.toy.backend.Dto.WishlistItemResponse;
import lsy.toy.backend.Service.WishlistService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    // 1. 내 위시리스트 조회 (GET, JWT 필요)
    @GetMapping
    public List<WishlistItemResponse> getWishlist(Authentication authentication) {
        return wishlistService.getWishlist(authentication.getName());
    }

    // 2. 위시리스트에 상품 담기 (POST) - 이미 있으면 그대로 둠
    @PostMapping("/items")
    public List<WishlistItemResponse> addItem(Authentication authentication, @RequestBody AddWishlistItemRequest request) {
        return wishlistService.addItem(authentication.getName(), request.getProductId());
    }

    // 3. 특정 상품 찜 해제 (DELETE)
    @DeleteMapping("/items/{productId}")
    public List<WishlistItemResponse> removeItem(Authentication authentication, @PathVariable Long productId) {
        return wishlistService.removeItem(authentication.getName(), productId);
    }
}
