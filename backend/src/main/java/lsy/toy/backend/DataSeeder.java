package lsy.toy.backend;

import lsy.toy.backend.Entity.Banner;
import lsy.toy.backend.Entity.Category;
import lsy.toy.backend.Entity.Order;
import lsy.toy.backend.Entity.OrderItem;
import lsy.toy.backend.Entity.Product;
import lsy.toy.backend.Entity.Team;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.BannerRepository;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.CategoryRepository;
import lsy.toy.backend.Repository.OrderRepository;
import lsy.toy.backend.Repository.ProductRepository;
import lsy.toy.backend.Repository.TeamRepository;
import lsy.toy.backend.Repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 💡 테이블이 비어 있을 때만 초기 데모 데이터를 채워 넣습니다.
@Component
public class DataSeeder implements CommandLineRunner {

    private static final List<String> CATEGORY_NAMES =
        List.of("유니폼", "모자", "응원용품", "스포츠용품", "잡화", "홈/리빙");

    // 💡 구단별 카테고리 (category와 별도 축)
    private static final List<String> TEAM_NAMES = List.of(
        "두산 베어스", "KIA 타이거즈", "롯데 자이언츠", "LG 트윈스", "NC 다이노스",
        "SSG 랜더스", "KT 위즈", "삼성 라이온즈", "키움 히어로즈", "한화 이글스"
    );

    // 💡 매장을 KBO 굿즈샵으로 개편하기 전까지 쓰던 구 카테고리. 이 이름이 DB에 남아있으면
    // 레거시 데모 데이터로 보고 상품/카테고리를 새 카탈로그로 교체한다.
    private static final List<String> LEGACY_CATEGORY_NAMES =
        List.of("전자기기", "식품", "생활용품", "뷰티", "스포츠/레저", "도서/문구");

    // 💡 데모 계정 기본 비밀번호. 실서비스라면 절대 이렇게 하드코딩하면 안 된다.
    private static final String DEMO_PASSWORD = "password123";

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final TeamRepository teamRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BannerRepository bannerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;
    private final String supabaseStorageUrl;

    public DataSeeder(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        TeamRepository teamRepository,
        CartItemRepository cartItemRepository,
        OrderRepository orderRepository,
        UserRepository userRepository,
        BannerRepository bannerRepository,
        PasswordEncoder passwordEncoder,
        EntityManager entityManager,
        @Value("${supabase.storage.url}") String supabaseStorageUrl
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.teamRepository = teamRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.bannerRepository = bannerRepository;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
        this.supabaseStorageUrl = supabaseStorageUrl;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 💡 시딩은 로그인 요청이 아니라 앱 기동 시점에 실행되므로 RLS 세션 변수가 비어 있다.
        // products/orders/users/reviews 정책은 모두 관리자(app_is_admin())를 예외로 허용하므로,
        // 이 트랜잭션 안에서만 관리자 컨텍스트임을 명시해 시딩이 막히지 않게 한다.
        entityManager.createNativeQuery("SELECT set_config('app.user_role', 'ADMIN', true)").getSingleResult();

        boolean hasLegacyCatalog = categoryRepository.findAll().stream()
            .anyMatch(category -> LEGACY_CATEGORY_NAMES.contains(category.getName()));
        // 💡 구단별 카테고리(team)가 새로 추가되기 전에 저장된 상품은 team이 비어 있다.
        // 이름 문자열만으로 구단을 역추정하기보다, 기존 마이그레이션 패턴대로 상품을 새로 시딩한다.
        boolean hasProductsMissingTeam = productRepository.count() > 0 && productRepository.findAll().stream()
            .anyMatch(product -> product.getTeam() == null);

        if (hasLegacyCatalog || hasProductsMissingTeam) {
            cartItemRepository.deleteAll();
            productRepository.deleteAll();
            categoryRepository.deleteAll();
            teamRepository.deleteAll();
        }

        if (categoryRepository.count() == 0) {
            categoryRepository.saveAll(CATEGORY_NAMES.stream().map(Category::new).toList());
        }
        if (teamRepository.count() == 0) {
            teamRepository.saveAll(TEAM_NAMES.stream().map(Team::new).toList());
        }

        Map<String, Category> categories = new LinkedHashMap<>();
        categoryRepository.findAll().forEach(category -> categories.put(category.getName(), category));
        Map<String, Team> teams = new LinkedHashMap<>();
        teamRepository.findAll().forEach(team -> teams.put(team.getName(), team));

        if (productRepository.count() == 0) {
            productRepository.saveAll(List.of(
                product("두산 베어스 홈 유니폼", categories.get("유니폼"), teams.get("두산 베어스"), 89000, 109000, "SALE"),
                product("KIA 타이거즈 어웨이 유니폼", categories.get("유니폼"), teams.get("KIA 타이거즈"), 89000, 109000, "SALE"),
                product("롯데 자이언츠 반팔 티셔츠", categories.get("유니폼"), teams.get("롯데 자이언츠"), 32000, null, "BEST"),
                product("LG 트윈스 볼캡", categories.get("모자"), teams.get("LG 트윈스"), 35000, null, "NEW"),
                product("NC 다이노스 스냅백", categories.get("모자"), teams.get("NC 다이노스"), 38000, null, null),
                product("SSG 랜더스 응원 타월", categories.get("응원용품"), teams.get("SSG 랜더스"), 12000, null, "BEST"),
                product("롯데 자이언츠 막대풍선 세트", categories.get("응원용품"), teams.get("롯데 자이언츠"), 8000, null, "BEST"),
                product("KT 위즈 응원 메가폰", categories.get("응원용품"), teams.get("KT 위즈"), 13000, null, null),
                product("삼성 라이온즈 기념구", categories.get("스포츠용품"), teams.get("삼성 라이온즈"), 15000, null, null),
                product("LG 트윈스 야구 글러브", categories.get("스포츠용품"), teams.get("LG 트윈스"), 68000, 79000, "SALE"),
                product("키움 히어로즈 미니배트 키링", categories.get("잡화"), teams.get("키움 히어로즈"), 9900, null, null),
                product("두산 베어스 마스코트 인형", categories.get("잡화"), teams.get("두산 베어스"), 25000, null, "BEST"),
                product("SSG 랜더스 텀블러", categories.get("잡화"), teams.get("SSG 랜더스"), 18000, null, "NEW"),
                product("한화 이글스 무릎담요", categories.get("홈/리빙"), teams.get("한화 이글스"), 22000, null, "NEW"),
                product("KIA 타이거즈 방석 쿠션", categories.get("홈/리빙"), teams.get("KIA 타이거즈"), 19800, null, null)
            ));
        }

        // 💡 use_at 컬럼이 새로 추가되기 전에 저장된 행은 값이 비어 있으므로 노출 상태로 채워준다.
        List<Product> missingUseAt = productRepository.findAll().stream()
            .filter(product -> product.getUseAt() == null)
            .toList();
        if (!missingUseAt.isEmpty()) {
            missingUseAt.forEach(product -> product.setUseAt("Y"));
            productRepository.saveAll(missingUseAt);
        }

        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                newUserWithPassword("김철수", "kim@example.com", "ADMIN"),
                newUserWithPassword("이영희", "lee@example.com", "USER"),
                newUserWithPassword("박민수", "park@example.com", "USER")
            ));
        }

        // 💡 password 컬럼이 새로 추가되기 전에 저장된 계정은 로그인할 수 없으므로 데모 비밀번호를 채워준다.
        List<User> missingPassword = userRepository.findAll().stream()
            .filter(user -> user.getPassword() == null)
            .toList();
        if (!missingPassword.isEmpty()) {
            missingPassword.forEach(user -> user.setPassword(passwordEncoder.encode(DEMO_PASSWORD)));
            userRepository.saveAll(missingPassword);
        }

        // 💡 role 컬럼이 새로 추가되기 전에 저장된 계정은 값이 비어 있으므로 일반 회원으로 채워준다.
        List<User> missingRole = userRepository.findAll().stream()
            .filter(user -> user.getRole() == null)
            .toList();
        if (!missingRole.isEmpty()) {
            missingRole.forEach(user -> user.setRole("USER"));
            userRepository.saveAll(missingRole);
        }

        // 💡 kim@example.com은 데모 관리자 계정. count()==0 시딩 블록은 테이블이 이미 채워진
        // 환경(예: role 컬럼 추가 전부터 존재하던 계정)에서는 재실행되지 않으므로, 매 기동 시
        // role을 직접 보정해 데모 관리자 권한이 항상 유지되도록 한다.
        userRepository.findByEmail("kim@example.com").ifPresent(admin -> {
            if (!"ADMIN".equals(admin.getRole())) {
                admin.setRole("ADMIN");
                userRepository.save(admin);
            }
        });

        // 💡 관리자 주문 관리 화면을 바로 확인할 수 있도록 데모 주문 몇 건을 채워 넣는다.
        if (orderRepository.count() == 0) {
            userRepository.findByEmail("lee@example.com").ifPresent(lee -> {
                Order order1 = new Order(lee, 89000 + 12000 * 2);
                order1.addItem(new OrderItem("두산 베어스 홈 유니폼", "유니폼", null, 89000, 1, null, null, "두산 베어스"));
                order1.addItem(new OrderItem("SSG 랜더스 응원 타월", "응원용품", null, 12000, 2, null, null, "SSG 랜더스"));
                order1.setStatus("배송완료");
                orderRepository.save(order1);
            });
            userRepository.findByEmail("park@example.com").ifPresent(park -> {
                Order order2 = new Order(park, 35000);
                order2.addItem(new OrderItem("LG 트윈스 볼캡", "모자", null, 35000, 1, null, null, "LG 트윈스"));
                order2.setStatus("배송중");
                orderRepository.save(order2);

                Order order3 = new Order(park, 9900 * 3);
                order3.addItem(new OrderItem("키움 히어로즈 미니배트 키링", "잡화", null, 9900, 3, null, null, "키움 히어로즈"));
                order3.setStatus("결제완료");
                orderRepository.save(order3);
            });
        }

        // 💡 기존에 Home.tsx에 하드코딩되어 있던 배너 3종을 그대로 초기 데이터로 옮긴다.
        // 이미지는 Supabase Storage의 banners 버킷에 이미 업로드되어 있던 고정 파일명을 그대로 참조한다.
        if (bannerRepository.count() == 0) {
            bannerRepository.saveAll(List.of(
                new Banner(
                    "SEASON OPENING", "🏆 2026 시즌 개막 기념 굿즈 최대 50% 할인",
                    "내가 응원하는 구단 굿즈, 지금이 기회!", "지금 쇼핑하기",
                    "linear-gradient(120deg, #f97316, #dc2626)", bannerImageUrl("ad_banner_1.png"), 0
                ),
                new Banner(
                    "WELCOME GIFT", "🎁 신규 회원 웰컴 혜택",
                    "첫 구매 시 15% 할인 쿠폰을 드려요", "혜택 받기",
                    "linear-gradient(120deg, #7c3aed, #ec4899)", bannerImageUrl("welcome.jpg"), 1
                ),
                new Banner(
                    "FREE SHIPPING", "⚾ 전 구단 굿즈 무료배송 이벤트",
                    "5만원 이상 구매 시 배송비 걱정 끝", "자세히 보기",
                    "linear-gradient(120deg, #0891b2, #10b981)", bannerImageUrl("free-shipping.jpg"), 2
                )
            ));
        }
    }

    private String bannerImageUrl(String fileName) {
        return supabaseStorageUrl + "/storage/v1/object/public/banners/" + fileName;
    }

    private Product product(
        String name, Category category, Team team, Integer price, Integer originalPrice, String badge
    ) {
        // 💡 데모 시드 데이터에는 실제 업로드 이미지가 없으므로 imageUrl은 null로 두고,
        // 프론트엔드가 플레이스홀더를 보여준다. 관리자가 상품 수정 화면에서 이미지를 올리면 채워진다.
        // 💡 평점/리뷰 개수는 더 이상 임의값을 넣지 않는다 — ReviewService가 실제 리뷰 기준으로 채운다.
        Product product = new Product(name, category, price, originalPrice, 0, 0, null, badge);
        product.setTeam(team);
        return product;
    }

    private User newUserWithPassword(String name, String email, String role) {
        User user = new User(name, email);
        user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        user.setRole(role);
        return user;
    }
}
