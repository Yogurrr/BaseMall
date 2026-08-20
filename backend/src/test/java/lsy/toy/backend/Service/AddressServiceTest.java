package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AddressRequest;
import lsy.toy.backend.Dto.AddressResponse;
import lsy.toy.backend.Entity.Address;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.AddressRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AddressService addressService;

    private User user() {
        User user = new User("구매자", "buyer@example.com");
        ReflectionTestUtils.setField(user, "id", 1L);
        return user;
    }

    private Address addressOf(User user, boolean isDefault) {
        Address address = new Address(user, null, "홍길동", "010-1234-5678", "12345", "서울시 어딘가", null);
        address.setIsDefault(isDefault);
        return address;
    }

    private AddressRequest addressRequest(Boolean isDefault) {
        AddressRequest request = new AddressRequest();
        ReflectionTestUtils.setField(request, "recipientName", "홍길동");
        ReflectionTestUtils.setField(request, "recipientPhone", "010-1234-5678");
        ReflectionTestUtils.setField(request, "zipCode", "12345");
        ReflectionTestUtils.setField(request, "address", "서울시 어딘가");
        ReflectionTestUtils.setField(request, "isDefault", isDefault);
        return request;
    }

    @Test
    void createAddress_첫배송지는_자동으로기본배송지가된다() {
        User user = user();
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(List.of());
        when(addressRepository.save(org.mockito.ArgumentMatchers.any(Address.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AddressResponse response = addressService.createAddress("buyer@example.com", addressRequest(false));

        assertThat(response.getIsDefault()).isTrue();
    }

    @Test
    void createAddress_기본으로명시하면_기존기본을해제한다() {
        User user = user();
        Address existingDefault = addressOf(user, true);
        List<Address> existing = new ArrayList<>(List.of(existingDefault));

        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(existing);
        when(addressRepository.save(org.mockito.ArgumentMatchers.any(Address.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(addressRepository.saveAll(org.mockito.ArgumentMatchers.anyList()))
            .thenAnswer(invocation -> invocation.getArgument(0));

        addressService.createAddress("buyer@example.com", addressRequest(true));

        assertThat(existingDefault.getIsDefault()).isFalse();
    }

    @Test
    void updateAddress_본인소유가아니면_404를던진다() {
        User user = user();
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(addressRepository.findByIdAndUser_Id(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.updateAddress("buyer@example.com", 99L, addressRequest(null)))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(404));
    }

    @Test
    void deleteAddress_기본배송지를삭제하면_다음배송지가기본으로승격된다() {
        User user = user();
        Address deletedDefault = addressOf(user, true);
        ReflectionTestUtils.setField(deletedDefault, "id", 1L);
        Address next = addressOf(user, false);
        ReflectionTestUtils.setField(next, "id", 2L);

        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(user));
        when(addressRepository.findByIdAndUser_Id(1L, 1L)).thenReturn(Optional.of(deletedDefault));
        // 💡 삭제 직후 남은 배송지 목록 조회가 두 번(승격 대상 조회 + getMyAddresses) 일어나므로 매번 최신 상태를 반환한다.
        when(addressRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(List.of(next));
        when(addressRepository.save(eq(next))).thenAnswer(invocation -> invocation.getArgument(0));

        List<AddressResponse> remaining = addressService.deleteAddress("buyer@example.com", 1L);

        assertThat(next.getIsDefault()).isTrue();
        assertThat(remaining).hasSize(1);
    }
}
