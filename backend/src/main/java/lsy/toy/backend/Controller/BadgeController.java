package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.BadgeRequest;
import lsy.toy.backend.Entity.Badge;
import lsy.toy.backend.Service.BadgeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    // 1. 뱃지 목록 조회 (GET) - 상품 카드가 색상을 그려야 하므로 공개
    @GetMapping
    public List<Badge> getBadges() {
        return badgeService.getBadges();
    }

    // 2. 뱃지 등록 (POST, 관리자 전용)
    @PostMapping
    public Badge createBadge(@RequestBody BadgeRequest request) {
        return badgeService.createBadge(request.getName(), request.getColorFrom(), request.getColorTo());
    }

    // 3. 뱃지 수정 (PUT, 관리자 전용)
    @PutMapping("/{id}")
    public Badge updateBadge(@PathVariable Long id, @RequestBody BadgeRequest request) {
        return badgeService.updateBadge(id, request.getName(), request.getColorFrom(), request.getColorTo());
    }

    // 4. 뱃지 삭제 (DELETE, 관리자 전용)
    @DeleteMapping("/{id}")
    public void deleteBadge(@PathVariable Long id) {
        badgeService.deleteBadge(id);
    }
}
