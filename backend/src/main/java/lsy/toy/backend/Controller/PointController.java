package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.PointTransactionResponse;
import lsy.toy.backend.Service.PointService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/points")
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    // 마이페이지 - 적립금 내역 조회 (GET, JWT 필요)
    @GetMapping("/me")
    public List<PointTransactionResponse> getMyTransactions(Authentication authentication) {
        return pointService.getMyTransactions(authentication.getName());
    }
}
