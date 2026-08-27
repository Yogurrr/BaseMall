package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.CouponResponse;
import lsy.toy.backend.Dto.IssueCouponRequest;
import lsy.toy.backend.Dto.IssueCouponResponse;
import lsy.toy.backend.Service.CouponService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    // 1. 내 쿠폰 목록 조회 (마이페이지 쿠폰 내역, GET)
    @GetMapping("/me")
    public List<CouponResponse> getMyCoupons(Authentication authentication) {
        return couponService.getMyCoupons(authentication.getName());
    }

    // 2. 등급별 쿠폰 일괄 발급 (관리자 쿠폰 관리, POST)
    @PostMapping
    public ResponseEntity<IssueCouponResponse> issueCoupons(@RequestBody IssueCouponRequest request) {
        IssueCouponResponse response = new IssueCouponResponse(couponService.issueByGrade(request.getGrade()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
