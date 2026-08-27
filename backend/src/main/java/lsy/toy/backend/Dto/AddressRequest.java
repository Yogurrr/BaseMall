package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

public class AddressRequest {
    private String label;
    @NotBlank(message = "받는 분을 입력해주세요.")
    private String recipientName;
    @NotBlank(message = "연락처를 입력해주세요.")
    private String recipientPhone;
    @NotBlank(message = "배송지 주소를 입력해주세요.")
    private String zipCode;
    @NotBlank(message = "배송지 주소를 입력해주세요.")
    private String address;
    private String addressDetail;
    private Boolean isDefault;

    public String getLabel() { return label; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public String getZipCode() { return zipCode; }
    public String getAddress() { return address; }
    public String getAddressDetail() { return addressDetail; }
    public Boolean getIsDefault() { return isDefault; }
}
