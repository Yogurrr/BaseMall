package lsy.toy.backend.Controller;

import jakarta.validation.Valid;
import lsy.toy.backend.Dto.BannerRequest;
import lsy.toy.backend.Dto.ImageUploadResponse;
import lsy.toy.backend.Dto.UpdateBannerActiveRequest;
import lsy.toy.backend.Entity.Banner;
import lsy.toy.backend.Service.BannerService;
import lsy.toy.backend.Service.SupabaseStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
public class BannerController {

    // 💡 상품 이미지(product-images)와 분리된 전용 버킷. 프론트 Home.tsx가 예전부터 쓰던 이름과 맞춘다.
    private static final String BANNER_BUCKET = "banners";

    private final BannerService bannerService;
    private final SupabaseStorageService supabaseStorageService;

    public BannerController(BannerService bannerService, SupabaseStorageService supabaseStorageService) {
        this.bannerService = bannerService;
        this.supabaseStorageService = supabaseStorageService;
    }

    // 1. 홈 화면 캐러셀용 - 노출 중인 배너만 순서대로 (공개)
    @GetMapping
    public List<Banner> getActiveBanners() {
        return bannerService.getActiveBanners();
    }

    // 2. 관리자 배너 관리 화면용 - 비노출 배너 포함 전체 (관리자 전용)
    @GetMapping("/admin")
    public List<Banner> getAllBanners() {
        return bannerService.getAllBanners();
    }

    // 3. 배너 등록 (POST)
    @PostMapping
    public ResponseEntity<Banner> createBanner(@RequestBody BannerRequest request) {
        Banner created = bannerService.createBanner(
            request.getEyebrow(), request.getTitle(), request.getDescription(),
            request.getCtaLabel(), request.getGradient(), request.getImageUrl(),
            request.getSortOrder(), request.getActive()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 4. 배너 수정 (PUT)
    @PutMapping("/{id}")
    public Banner updateBanner(@PathVariable Long id, @RequestBody BannerRequest request) {
        return bannerService.updateBanner(
            id, request.getEyebrow(), request.getTitle(), request.getDescription(),
            request.getCtaLabel(), request.getGradient(), request.getImageUrl(),
            request.getSortOrder(), request.getActive()
        );
    }

    // 5. 노출 여부만 빠르게 토글 (PATCH)
    @PatchMapping("/{id}/active")
    public Banner updateActive(@PathVariable Long id, @Valid @RequestBody UpdateBannerActiveRequest request) {
        return bannerService.updateActive(id, request.getActive());
    }

    // 6. 배너 삭제 (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    // 7. 배너 이미지 업로드 (POST) - banners 버킷에 업로드하고 public URL을 반환한다.
    @PostMapping("/images")
    public ImageUploadResponse uploadImage(@RequestParam("file") MultipartFile file) {
        return new ImageUploadResponse(supabaseStorageService.uploadImage(file, BANNER_BUCKET));
    }
}
