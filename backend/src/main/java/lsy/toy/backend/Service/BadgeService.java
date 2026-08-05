package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.Badge;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Repository.BadgeRepository;
import lsy.toy.backend.Repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BadgeService {

    private static final Logger log = LoggerFactory.getLogger(BadgeService.class);

    private final BadgeRepository badgeRepository;
    private final ProductRepository productRepository;

    public BadgeService(BadgeRepository badgeRepository, ProductRepository productRepository) {
        this.badgeRepository = badgeRepository;
        this.productRepository = productRepository;
    }

    public List<Badge> getBadges() {
        return badgeRepository.findAll();
    }

    public Badge createBadge(String name, String colorFrom, String colorTo) {
        String trimmedName = requireName(name);
        if (badgeRepository.existsByName(trimmedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 뱃지입니다: " + trimmedName);
        }

        Badge badge = new Badge(trimmedName, requireColor(colorFrom), requireColor(colorTo));
        Badge saved = badgeRepository.save(badge);
        log.info("뱃지 등록: badgeId={}, name={}", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Badge updateBadge(Long id, String name, String colorFrom, String colorTo) {
        Badge badge = findBadge(id);
        String trimmedName = requireName(name);

        if (!trimmedName.equals(badge.getName())) {
            if (badgeRepository.existsByName(trimmedName)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 뱃지입니다: " + trimmedName);
            }
            renameOnProducts(badge.getName(), trimmedName);
            badge.setName(trimmedName);
        }

        badge.setColorFrom(requireColor(colorFrom));
        badge.setColorTo(requireColor(colorTo));

        Badge saved = badgeRepository.save(badge);
        log.info("뱃지 수정: badgeId={}, name={}", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public void deleteBadge(Long id) {
        Badge badge = findBadge(id);

        // 💡 badge는 상품에 FK가 아니라 자유 문자열로 저장되므로, 삭제 전에 해당 뱃지를
        // 쓰고 있던 상품들의 badge를 비워 "존재하지 않는 뱃지" 문자열이 남지 않게 한다.
        List<Product> affected = productRepository.findByBadge(badge.getName());
        affected.forEach(product -> product.setBadge(null));
        productRepository.saveAll(affected);

        badgeRepository.delete(badge);
        log.info("뱃지 삭제: badgeId={}, name={}, 영향받은 상품 수={}", id, badge.getName(), affected.size());
    }

    private void renameOnProducts(String oldName, String newName) {
        List<Product> affected = productRepository.findByBadge(oldName);
        affected.forEach(product -> product.setBadge(newName));
        productRepository.saveAll(affected);
    }

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "뱃지 이름을 입력해주세요.");
        }
        return name.trim();
    }

    private String requireColor(String color) {
        if (color == null || color.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "뱃지 색상을 입력해주세요.");
        }
        return color.trim();
    }

    private Badge findBadge(Long id) {
        return badgeRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "뱃지를 찾을 수 없습니다: " + id));
    }
}
