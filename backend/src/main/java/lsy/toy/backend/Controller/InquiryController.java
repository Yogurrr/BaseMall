package lsy.toy.backend.Controller;

import jakarta.validation.Valid;
import lsy.toy.backend.Dto.AdminInquiryResponse;
import lsy.toy.backend.Dto.ImageUploadResponse;
import lsy.toy.backend.Dto.InquiryAnswerRequest;
import lsy.toy.backend.Dto.InquiryRequest;
import lsy.toy.backend.Dto.InquiryResponse;
import lsy.toy.backend.Security.SecurityUtils;
import lsy.toy.backend.Service.InquiryService;
import lsy.toy.backend.Service.SupabaseStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    // 💡 상품 이미지(product-images)/배너(banners)와 분리된 전용 버킷.
    private static final String INQUIRY_BUCKET = "inquiry-images";

    private final InquiryService inquiryService;
    private final SupabaseStorageService supabaseStorageService;

    public InquiryController(InquiryService inquiryService, SupabaseStorageService supabaseStorageService) {
        this.inquiryService = inquiryService;
        this.supabaseStorageService = supabaseStorageService;
    }

    // 1. 문의 첨부 이미지 업로드 (POST, JWT 필요)
    @PostMapping("/images")
    public ImageUploadResponse uploadImage(@RequestParam("file") MultipartFile file) {
        return new ImageUploadResponse(supabaseStorageService.uploadImage(file, INQUIRY_BUCKET));
    }

    // 2. 문의 작성 (POST, JWT 필요)
    @PostMapping
    public ResponseEntity<InquiryResponse> createInquiry(Authentication authentication, @Valid @RequestBody InquiryRequest request) {
        InquiryResponse created = inquiryService.createInquiry(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 3. 내 문의 목록 조회 (GET, JWT 필요)
    @GetMapping("/me")
    public List<InquiryResponse> getMyInquiries(Authentication authentication) {
        return inquiryService.getMyInquiries(authentication.getName());
    }

    // 4. 문의 상세 조회 (GET, 작성자 본인 또는 관리자)
    @GetMapping("/{id}")
    public InquiryResponse getInquiry(@PathVariable Long id, Authentication authentication) {
        return inquiryService.getInquiry(id, authentication.getName(), SecurityUtils.isAdmin(authentication));
    }

    // 5. 문의 삭제 (DELETE, 작성자 본인만, 답변 완료 전에만 가능)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInquiry(@PathVariable Long id, Authentication authentication) {
        inquiryService.deleteInquiry(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // 6. 전체 문의 목록 조회 (GET, 관리자 전용)
    @GetMapping
    public List<AdminInquiryResponse> getAllInquiries() {
        return inquiryService.getAllInquiries();
    }

    // 7. 문의 답변 등록 (PATCH, 관리자 전용)
    @PatchMapping("/{id}/answer")
    public AdminInquiryResponse answerInquiry(@PathVariable Long id, @Valid @RequestBody InquiryAnswerRequest request) {
        return inquiryService.answerInquiry(id, request.getAnswer());
    }
}
