import { Button } from '../Button/Button';
import { openDaumPostcode } from '../../utils/daumPostcode';
import type { Address } from '../../types/address';
import styles from './ShippingInfoForm.module.css';

const PHONE_PREFIXES = ['010', '011', '016', '017', '018', '019'] as const;

const formatAddressOption = (savedAddress: Address) => {
  const prefix = savedAddress.label ? `[${savedAddress.label}] ` : '';
  const suffix = savedAddress.isDefault ? ' (기본)' : '';
  return `${prefix}${savedAddress.recipientName} · ${savedAddress.address}${suffix}`;
};

interface ShippingInfoFormProps {
  recipientName: string;
  onRecipientNameChange: (value: string) => void;
  phonePrefix: string;
  onPhonePrefixChange: (value: string) => void;
  phoneMiddle: string;
  onPhoneMiddleChange: (value: string) => void;
  phoneLast: string;
  onPhoneLastChange: (value: string) => void;
  zipCode: string;
  onZipCodeChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  addressDetail: string;
  onAddressDetailChange: (value: string) => void;
  // 💡 로그인 사용자에 한해 전달되는 배송지록 불러오기/저장 관련 옵션. 비로그인/게스트 결제에서는 생략된다.
  savedAddresses?: Address[];
  selectedSavedAddressId?: number | null;
  onSelectSavedAddress?: (savedAddress: Address) => void;
  onDeleteSavedAddress?: (id: number) => void;
  showSaveOption?: boolean;
  saveAddress?: boolean;
  onSaveAddressChange?: (value: boolean) => void;
  addressLabel?: string;
  onAddressLabelChange?: (value: string) => void;
  saveAsDefault?: boolean;
  onSaveAsDefaultChange?: (value: boolean) => void;
}

export const ShippingInfoForm = ({
  recipientName,
  onRecipientNameChange,
  phonePrefix,
  onPhonePrefixChange,
  phoneMiddle,
  onPhoneMiddleChange,
  phoneLast,
  onPhoneLastChange,
  zipCode,
  onZipCodeChange,
  address,
  onAddressChange,
  addressDetail,
  onAddressDetailChange,
  savedAddresses = [],
  selectedSavedAddressId,
  onSelectSavedAddress,
  onDeleteSavedAddress,
  showSaveOption = false,
  saveAddress = false,
  onSaveAddressChange,
  addressLabel = '',
  onAddressLabelChange,
  saveAsDefault = false,
  onSaveAsDefaultChange,
}: ShippingInfoFormProps) => {
  const handleSearchAddress = () => {
    openDaumPostcode((data) => {
      onZipCodeChange(data.zonecode);
      onAddressChange(data.address);
    });
  };

  const handleSelectSavedAddress = (id: string) => {
    const savedAddress = savedAddresses.find((item) => item.id === Number(id));
    if (savedAddress) {
      onSelectSavedAddress?.(savedAddress);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>배송지정보</h2>
      <div className={styles.table}>
        {savedAddresses.length > 0 && (
          <div className={styles.row}>
            <div className={styles.label}>저장된 배송지</div>
            <div className={styles.value}>
              <select
                value={selectedSavedAddressId ?? ''}
                onChange={(e) => handleSelectSavedAddress(e.target.value)}
              >
                <option value="">배송지를 선택하세요</option>
                {savedAddresses.map((savedAddress) => (
                  <option key={savedAddress.id} value={savedAddress.id}>
                    {formatAddressOption(savedAddress)}
                  </option>
                ))}
              </select>
              {selectedSavedAddressId != null && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteSavedAddress?.(selectedSavedAddressId!)}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.label}>받는분</div>
          <div className={styles.value}>
            <input
              value={recipientName}
              onChange={(e) => onRecipientNameChange(e.target.value)}
              placeholder="받는 분의 이름을 입력하세요"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>연락처</div>
          <div className={styles.value}>
            <select value={phonePrefix} onChange={(e) => onPhonePrefixChange(e.target.value)}>
              {PHONE_PREFIXES.map((prefix) => (
                <option key={prefix} value={prefix}>
                  {prefix}
                </option>
              ))}
            </select>
            <span>-</span>
            <input
              className={styles.phonePart}
              value={phoneMiddle}
              onChange={(e) => onPhoneMiddleChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
            />
            <span>-</span>
            <input
              className={styles.phonePart}
              value={phoneLast}
              onChange={(e) => onPhoneLastChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="5678"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>주소</div>
          <div className={styles.valueColumn}>
            <div className={styles.addressLine}>
              <input
                className={styles.zipInput}
                value={zipCode}
                readOnly
                placeholder="우편번호"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleSearchAddress}>
                주소 검색
              </Button>
            </div>
            <input
              className={styles.addressInput}
              value={address}
              readOnly
              placeholder="주소 검색 버튼을 눌러 주소를 입력하세요"
            />
            <input
              value={addressDetail}
              onChange={(e) => onAddressDetailChange(e.target.value)}
              placeholder="상세주소를 입력하세요 (선택)"
            />
          </div>
        </div>
      </div>

      {showSaveOption && (
        <div className={styles.saveBox}>
          <label className={styles.saveRow}>
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => onSaveAddressChange?.(e.target.checked)}
            />
            이 배송지를 다음에도 쓸 수 있게 저장할게요
          </label>
          {saveAddress && (
            <div className={styles.saveOptions}>
              <input
                className={styles.labelInput}
                value={addressLabel}
                onChange={(e) => onAddressLabelChange?.(e.target.value)}
                placeholder="배송지 별칭 (선택, 예: 집)"
                maxLength={20}
              />
              <label className={styles.saveRow}>
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => onSaveAsDefaultChange?.(e.target.checked)}
                />
                기본 배송지로 설정
              </label>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
