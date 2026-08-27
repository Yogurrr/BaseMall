package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Banner;
import lsy.toy.backend.Repository.BannerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BannerService {

    private static final Logger log = LoggerFactory.getLogger(BannerService.class);

    private final BannerRepository bannerRepository;

    public BannerService(BannerRepository bannerRepository) {
        this.bannerRepository = bannerRepository;
    }

    public List<Banner> getActiveBanners() {
        return bannerRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
    }

    public List<Banner> getAllBanners() {
        return bannerRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    public Banner createBanner(
        String eyebrow, String title, String description, String ctaLabel, String gradient,
        String imageUrl, Integer sortOrder, Boolean active
    ) {
        Banner banner = new Banner(eyebrow, title, description, ctaLabel, gradient, imageUrl, orZero(sortOrder));
        if (active != null) {
            banner.setActive(active);
        }
        Banner saved = bannerRepository.save(banner);
        log.info("배너 등록: bannerId={}, title={}", saved.getId(), saved.getTitle());
        return saved;
    }

    public Banner updateBanner(
        Long id, String eyebrow, String title, String description, String ctaLabel, String gradient,
        String imageUrl, Integer sortOrder, Boolean active
    ) {
        Banner banner = findBanner(id);

        banner.setEyebrow(eyebrow);
        banner.setTitle(title);
        banner.setDescription(description);
        banner.setCtaLabel(ctaLabel);
        banner.setGradient(gradient);
        banner.setImageUrl(imageUrl);
        banner.setSortOrder(orZero(sortOrder));
        if (active != null) {
            banner.setActive(active);
        }

        Banner saved = bannerRepository.save(banner);
        log.info("배너 수정: bannerId={}, title={}", saved.getId(), saved.getTitle());
        return saved;
    }

    public Banner updateActive(Long id, Boolean active) {
        Banner banner = findBanner(id);
        banner.setActive(active);
        return bannerRepository.save(banner);
    }

    public void deleteBanner(Long id) {
        Banner banner = findBanner(id);
        bannerRepository.delete(banner);
        log.info("배너 삭제: bannerId={}", id);
    }

    private int orZero(Integer value) {
        return value == null ? 0 : value;
    }

    private Banner findBanner(Long id) {
        return bannerRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "배너를 찾을 수 없습니다: " + id));
    }
}
