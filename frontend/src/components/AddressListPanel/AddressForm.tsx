import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../Button/Button';
import { openDaumPostcode } from '../../utils/daumPostcode';
import type { SaveAddressParams } from '../../api/addressApi';
import type { Address } from '../../types/address';
import styles from './AddressListPanel.module.css';

const PHONE_PREFIXES = ['010', '011', '016', '017', '018', '019'] as const;

const addressSchema = z.object({
  label: z.string(),
  recipientName: z.string().trim().min(1, '받는 분을 입력해주세요.'),
  phonePrefix: z.string(),
  phoneMiddle: z.string().length(4, '연락처를 입력해주세요.'),
  phoneLast: z.string().length(4, '연락처를 입력해주세요.'),
  zipCode: z
    .string()
    .trim()
    .min(1, '주소 검색 버튼을 눌러 주소를 입력해주세요.'),
  address: z
    .string()
    .trim()
    .min(1, '주소 검색 버튼을 눌러 주소를 입력해주세요.'),
  addressDetail: z.string(),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const emptyForm: AddressFormValues = {
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

const toFormFromAddress = (item: Address): AddressFormValues => {
  const [phonePrefix = '010', phoneMiddle = '', phoneLast = ''] =
    item.recipientPhone.split('-');
  return {
    label: item.label ?? '',
    recipientName: item.recipientName,
    phonePrefix,
    phoneMiddle,
    phoneLast,
    zipCode: item.zipCode,
    address: item.address,
    addressDetail: item.addressDetail ?? '',
    isDefault: item.isDefault,
  };
};

interface AddressFormProps {
  initialAddress?: Address;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (params: SaveAddressParams) => void;
}

export const AddressForm = ({
  initialAddress,
  isEditing,
  isSubmitting,
  onCancel,
  onSubmit,
}: AddressFormProps) => {
  const { register, handleSubmit, setValue } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialAddress
      ? toFormFromAddress(initialAddress)
      : emptyForm,
  });

  const handleSearchAddress = () => {
    openDaumPostcode((data) => {
      setValue('zipCode', data.zonecode, { shouldValidate: true });
      setValue('address', data.address, { shouldValidate: true });
    });
  };

  const submit = (values: AddressFormValues) => {
    onSubmit({
      label: values.label.trim() || undefined,
      recipientName: values.recipientName.trim(),
      recipientPhone: `${values.phonePrefix}-${values.phoneMiddle}-${values.phoneLast}`,
      zipCode: values.zipCode.trim(),
      address: values.address.trim(),
      addressDetail: values.addressDetail.trim() || undefined,
      isDefault: values.isDefault,
    });
  };

  const onInvalid = (formErrors: FieldErrors<AddressFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(submit, onInvalid)}
      noValidate
    >
      <p className={styles.formTitle}>
        {isEditing ? '배송지 수정' : '새 배송지 추가'}
      </p>
      <div className={styles.formRow}>
        <input
          className={styles.labelInput}
          {...register('label')}
          placeholder="배송지 별칭 (선택, 예: 집)"
          maxLength={20}
        />
      </div>

      <div className={styles.formRow}>
        <input
          {...register('recipientName')}
          placeholder="받는 분의 이름을 입력하세요"
        />
      </div>

      <div className={styles.formRow}>
        <select className={styles.phonePrefix} {...register('phonePrefix')}>
          {PHONE_PREFIXES.map((prefix) => (
            <option key={prefix} value={prefix}>
              {prefix}
            </option>
          ))}
        </select>
        <span>-</span>
        <input
          className={styles.phonePart}
          {...register('phoneMiddle', {
            onChange: (e) =>
              setValue(
                'phoneMiddle',
                e.target.value.replace(/\D/g, '').slice(0, 4),
              ),
          })}
          inputMode="numeric"
          maxLength={4}
          placeholder="1234"
        />
        <span>-</span>
        <input
          className={styles.phonePart}
          {...register('phoneLast', {
            onChange: (e) =>
              setValue(
                'phoneLast',
                e.target.value.replace(/\D/g, '').slice(0, 4),
              ),
          })}
          inputMode="numeric"
          maxLength={4}
          placeholder="5678"
        />
      </div>

      <div className={styles.formRow}>
        <input
          className={styles.zipInput}
          {...register('zipCode')}
          readOnly
          placeholder="우편번호"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearchAddress}
        >
          주소 검색
        </Button>
      </div>
      <div className={styles.formRow}>
        <input
          className={styles.addressInput}
          {...register('address')}
          readOnly
          placeholder="주소 검색 버튼을 눌러 주소를 입력하세요"
        />
      </div>
      <div className={styles.formRow}>
        <input
          className={styles.addressInput}
          {...register('addressDetail')}
          placeholder="상세주소를 입력하세요 (선택)"
        />
      </div>

      <label className={styles.checkboxRow}>
        <input type="checkbox" {...register('isDefault')} />
        기본 배송지로 설정
      </label>

      <div className={styles.formActions}>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="md" isLoading={isSubmitting}>
          {isEditing ? '수정 완료' : '저장'}
        </Button>
      </div>
    </form>
  );
};
