package lsy.toy.backend.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;

// 💡 관리자가 올린 상품 이미지를 Supabase Storage(public 버킷)에 업로드한다.
// service role 키는 쓰기 권한이 있어 백엔드에만 두고, 프론트에는 절대 내려주지 않는다.
@Service
public class SupabaseStorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
        "image/png", ".png",
        "image/jpeg", ".jpg",
        "image/webp", ".webp",
        "image/gif", ".gif"
    );

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private final String storageUrl;
    private final String bucket;
    private final String serviceRoleKey;

    public SupabaseStorageService(
        @Value("${supabase.storage.url}") String storageUrl,
        @Value("${supabase.storage.bucket}") String bucket,
        @Value("${supabase.storage.service-role-key}") String serviceRoleKey
    ) {
        this.storageUrl = storageUrl;
        this.bucket = bucket;
        this.serviceRoleKey = serviceRoleKey;
    }

    public String uploadProductImage(MultipartFile file) {
        return uploadImage(file, bucket);
    }

    // 💡 상품 이미지와 별도로, 홈 화면 광고 배너(banners 버킷)도 같은 업로드 로직을 재사용한다.
    public String uploadImage(MultipartFile file, String targetBucket) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지 파일이 비어 있습니다.");
        }

        String extension = ALLOWED_CONTENT_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 형식입니다. (png, jpg, webp, gif만 가능)");
        }

        String objectPath = UUID.randomUUID() + extension;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(storageUrl + "/storage/v1/object/" + targetBucket + "/" + objectPath))
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", file.getContentType())
                .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.error("Supabase Storage 업로드 실패: status={}, body={}", response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "이미지 업로드에 실패했습니다.");
            }
        } catch (IOException | InterruptedException e) {
            log.error("Supabase Storage 업로드 중 오류", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "이미지 업로드에 실패했습니다.");
        }

        return storageUrl + "/storage/v1/object/public/" + targetBucket + "/" + objectPath;
    }
}
