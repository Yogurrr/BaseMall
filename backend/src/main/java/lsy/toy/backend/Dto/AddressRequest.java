package lsy.toy.backend.Dto;

public class AddressRequest {
    private String label;
    private String recipientName;
    private String recipientPhone;
    private String zipCode;
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
