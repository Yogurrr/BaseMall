package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.RecentViewItemResponse;
import lsy.toy.backend.Service.RecentViewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recent-views")
@CrossOrigin(origins = "http://localhost:5173")
public class RecentViewController {

    private final RecentViewService recentViewService;

    public RecentViewController(RecentViewService recentViewService) {
        this.recentViewService = recentViewService;
    }

    // 1. 최근 본 상품 목록 조회 (GET, JWT 필요)
    @GetMapping
    public List<RecentViewItemResponse> getRecentViews(Authentication authentication) {
        return recentViewService.getRecentViews(authentication.getName());
    }

    // 2. 상품 상세 조회 시 조회 이력 기록 (POST)
    @PostMapping("/{productId}")
    public ResponseEntity<Void> recordView(Authentication authentication, @PathVariable Long productId) {
        recentViewService.recordView(authentication.getName(), productId);
        return ResponseEntity.noContent().build();
    }
}
