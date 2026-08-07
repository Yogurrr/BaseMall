package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Address;

public class AddressResponse {
    private final Long id;
    private final String label;
    private final String recipientName;
    private final String recipientPhone;
    private final String zipCode;
    private final String address;
    private final String addressDetail;
    private final boolean isDefault;

    public AddressResponse(Address entity) {
        this.id = entity.getId();
        this.label = entity.getLabel();
        this.recipientName = entity.getRecipientName();
        this.recipientPhone = entity.getRecipientPhone();
        this.zipCode = entity.getZipCode();
        this.address = entity.getAddress();
        this.addressDetail = entity.getAddressDetail();
        this.isDefault = entity.getIsDefault();
    }

    public Long getId() { return id; }
    public String getLabel() { return label; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public String getZipCode() { return zipCode; }
    public String getAddress() { return address; }
    public String getAddressDetail() { return addressDetail; }
    public boolean getIsDefault() { return isDefault; }
}
