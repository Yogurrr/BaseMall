package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.AddressRequest;
import lsy.toy.backend.Dto.AddressResponse;
import lsy.toy.backend.Service.AddressService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@CrossOrigin(origins = "http://localhost:5173")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    // 1. 내 저장 배송지 목록 조회 (기본 배송지 우선, GET, JWT 필요)
    @GetMapping("/me")
    public List<AddressResponse> getMyAddresses(Authentication authentication) {
        return addressService.getMyAddresses(authentication.getName());
    }

    // 2. 배송지 저장 (주문/결제 화면의 "배송지 저장" 체크박스, POST)
    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(Authentication authentication, @RequestBody AddressRequest request) {
        AddressResponse created = addressService.createAddress(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 3. 저장된 배송지 수정 (PUT)
    @PutMapping("/{id}")
    public AddressResponse updateAddress(Authentication authentication, @PathVariable Long id, @RequestBody AddressRequest request) {
        return addressService.updateAddress(authentication.getName(), id, request);
    }

    // 4. 저장된 배송지 삭제 (DELETE)
    @DeleteMapping("/{id}")
    public List<AddressResponse> deleteAddress(Authentication authentication, @PathVariable Long id) {
        return addressService.deleteAddress(authentication.getName(), id);
    }

    // 5. 기본 배송지로 지정 (PATCH)
    @PatchMapping("/{id}/default")
    public AddressResponse setDefaultAddress(Authentication authentication, @PathVariable Long id) {
        return addressService.setDefaultAddress(authentication.getName(), id);
    }
}
