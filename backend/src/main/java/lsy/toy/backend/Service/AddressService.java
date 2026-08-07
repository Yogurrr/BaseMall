package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AddressRequest;
import lsy.toy.backend.Dto.AddressResponse;
import lsy.toy.backend.Entity.Address;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.AddressRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<AddressResponse> getMyAddresses(String email) {
        User user = findUser(email);
        return toResponses(addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(user.getId()));
    }

    @Transactional
    public AddressResponse createAddress(String email, AddressRequest request) {
        validateAddressRequest(request);
        User user = findUser(email);

        List<Address> existing = addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(user.getId());
        // 💡 첫 배송지는 자동으로 기본 배송지가 되고, 이후엔 명시적으로 요청한 경우에만 기본이 바뀐다.
        boolean makeDefault = existing.isEmpty() || Boolean.TRUE.equals(request.getIsDefault());
        if (makeDefault && !existing.isEmpty()) {
            clearDefault(existing);
        }

        Address address = new Address(
            user,
            isBlank(request.getLabel()) ? null : request.getLabel().trim(),
            request.getRecipientName().trim(),
            request.getRecipientPhone().trim(),
            request.getZipCode().trim(),
            request.getAddress().trim(),
            isBlank(request.getAddressDetail()) ? null : request.getAddressDetail().trim()
        );
        address.setIsDefault(makeDefault);

        return new AddressResponse(addressRepository.save(address));
    }

    // 💡 삭제한 배송지가 기본 배송지였다면, 남은 것 중 가장 최근 저장된 배송지를 새 기본으로 승격한다.
    @Transactional
    public List<AddressResponse> deleteAddress(String email, Long id) {
        User user = findUser(email);
        Address address = findOwnedAddress(id, user.getId());
        boolean wasDefault = address.getIsDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(user.getId()).stream()
                .findFirst()
                .ifPresent(next -> {
                    next.setIsDefault(true);
                    addressRepository.save(next);
                });
        }

        return getMyAddresses(email);
    }

    @Transactional
    public AddressResponse setDefaultAddress(String email, Long id) {
        User user = findUser(email);
        Address address = findOwnedAddress(id, user.getId());

        clearDefault(addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(user.getId()));
        address.setIsDefault(true);

        return new AddressResponse(addressRepository.save(address));
    }

    private void clearDefault(List<Address> addresses) {
        addresses.forEach(a -> a.setIsDefault(false));
        addressRepository.saveAll(addresses);
    }

    private List<AddressResponse> toResponses(List<Address> addresses) {
        return addresses.stream().map(AddressResponse::new).toList();
    }

    private Address findOwnedAddress(Long id, Long userId) {
        return addressRepository.findByIdAndUser_Id(id, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "배송지를 찾을 수 없습니다: " + id));
    }

    private void validateAddressRequest(AddressRequest request) {
        if (isBlank(request.getRecipientName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "받는 분을 입력해주세요.");
        }
        if (isBlank(request.getRecipientPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연락처를 입력해주세요.");
        }
        if (isBlank(request.getZipCode()) || isBlank(request.getAddress())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "배송지 주소를 입력해주세요.");
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
