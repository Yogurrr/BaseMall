import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import { Spinner } from '../Spinner/Spinner';
import { openDaumPostcode } from '../../utils/daumPostcode';
import { deleteAddress, fetchMyAddresses, saveAddress, setDefaultAddress } from '../../api/addressApi';
import styles from './AddressListPanel.module.css';

const PHONE_PREFIXES = ['010', '011', '016', '017', '018', '019'] as const;

const emptyForm = {
  label: '',
  recipientName: '',
  phonePrefix: '010',
  phoneMiddle: '',
  phoneLast: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  isDefault: false,
};

export const AddressListPanel = () => {
  const queryClient = useQueryClient();
  const { data: addresses = [], isLoading } = useQuery({ queryKey: ['addresses', 'me'], queryFn: fetchMyAddresses });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
      setIsFormOpen(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: () => setFormError('배송지를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: (updated) => {
      queryClient.setQueryData(['addresses', 'me'], updated);
    },
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
    },
  });

  const openForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormError(null);
  };

  const handleSearchAddress = () => {
    openDaumPostcode((data) => {
      setForm((prev) => ({ ...prev, zipCode: data.zonecode, address: data.address }));
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.recipientName.trim()) {
      setFormError('받는 분을 입력해주세요.');
      return;
    }
    if (form.phoneMiddle.length !== 4 || form.phoneLast.length !== 4) {
      setFormError('연락처를 입력해주세요.');
      return;
    }
    if (!form.zipCode.trim() || !form.address.trim()) {
      setFormError('주소 검색 버튼을 눌러 주소를 입력해주세요.');
      return;
    }

    saveMutation.mutate({
      label: form.label.trim() || undefined,
      recipientName: form.recipientName.trim(),
      recipientPhone: `${form.phonePrefix}-${form.phoneMiddle}-${form.phoneLast}`,
      zipCode: form.zipCode.trim(),
      address: form.address.trim(),
      addressDetail: form.addressDetail.trim() || undefined,
      isDefault: form.isDefault,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('이 배송지를 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.count}>저장된 배송지 {addresses.length}개</p>
        {!isFormOpen && (
          <Button type="button" size="md" onClick={openForm}>
            새 배송지 추가
          </Button>
        )}
      </div>

      {isFormOpen && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              className={styles.labelInput}
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="배송지 별칭 (선택, 예: 집)"
              maxLength={20}
            />
          </div>

          <div className={styles.formRow}>
            <input
              value={form.recipientName}
              onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))}
              placeholder="받는 분의 이름을 입력하세요"
            />
          </div>

          <div className={styles.formRow}>
            <select
              className={styles.phonePrefix}
              value={form.phonePrefix}
              onChange={(e) => setForm((prev) => ({ ...prev, phonePrefix: e.target.value }))}
            >
              {PHONE_PREFIXES.map((prefix) => (
                <option key={prefix} value={prefix}>
                  {prefix}
                </option>
              ))}
            </select>
            <span>-</span>
            <input
              className={styles.phonePart}
              value={form.phoneMiddle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phoneMiddle: e.target.value.replace(/\D/g, '').slice(0, 4) }))
              }
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
            />
            <span>-</span>
            <input
              className={styles.phonePart}
              value={form.phoneLast}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phoneLast: e.target.value.replace(/\D/g, '').slice(0, 4) }))
              }
              inputMode="numeric"
              maxLength={4}
              placeholder="5678"
            />
          </div>

          <div className={styles.formRow}>
            <input className={styles.zipInput} value={form.zipCode} readOnly placeholder="우편번호" />
            <Button type="button" variant="outline" size="sm" onClick={handleSearchAddress}>
              주소 검색
            </Button>
          </div>
          <div className={styles.formRow}>
            <input
              className={styles.addressInput}
              value={form.address}
              readOnly
              placeholder="주소 검색 버튼을 눌러 주소를 입력하세요"
            />
          </div>
          <div className={styles.formRow}>
            <input
              className={styles.addressInput}
              value={form.addressDetail}
              onChange={(e) => setForm((prev) => ({ ...prev, addressDetail: e.target.value }))}
              placeholder="상세주소를 입력하세요 (선택)"
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
            />
            기본 배송지로 설정
          </label>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.formActions}>
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              취소
            </Button>
            <Button type="submit" size="md" isLoading={saveMutation.isPending}>
              저장
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className={styles.empty}>
          <StatusMessage icon="📦">저장된 배송지가 없습니다.</StatusMessage>
        </div>
      ) : (
        <ul className={styles.list}>
          {addresses.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.info}>
                <div className={styles.titleRow}>
                  {item.label && <span className={styles.labelBadge}>{item.label}</span>}
                  <span className={styles.recipient}>{item.recipientName}</span>
                  {item.isDefault && <span className={styles.defaultBadge}>기본 배송지</span>}
                </div>
                <p className={styles.phone}>{item.recipientPhone}</p>
                <p className={styles.address}>
                  ({item.zipCode}) {item.address} {item.addressDetail}
                </p>
              </div>
              <div className={styles.cardActions}>
                {!item.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={defaultMutation.isPending && defaultMutation.variables === item.id}
                    onClick={() => defaultMutation.mutate(item.id)}
                  >
                    기본으로 설정
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  isLoading={deleteMutation.isPending && deleteMutation.variables === item.id}
                  onClick={() => handleDelete(item.id)}
                >
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
