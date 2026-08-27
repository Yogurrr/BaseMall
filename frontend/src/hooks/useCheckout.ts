import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from './useCart';
import { useCurrentUser } from './useCurrentUser';
import { isLoggedIn } from '../api/authToken';
import { createOrder } from '../api/orderApi';
import { prepareTossPayment, readyKakaoPayment } from '../api/paymentApi';
import { fetchMyCoupons } from '../api/couponApi';
import {
  deleteAddress,
  fetchMyAddresses,
  saveAddress,
} from '../api/addressApi';
import type { Address } from '../types/address';
import { useTossPaymentWidget } from './useTossPaymentWidget';

// 💡 배송지/결제수단 등 실제 주문에 쓰이는 필드만 스키마로 검증한다.
// 필수 조건은 기존 canSubmit 로직과 동일하게 유지한다.
const checkoutSchema = z.object({
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
  saveAddressChecked: z.boolean(),
  addressLabel: z.string(),
  saveAsDefault: z.boolean(),
  deliveryRequestOption: z.string(),
  customDeliveryRequest: z.string(),
  entryMethod: z.string(),
  entryNote: z.string(),
  selectedCouponId: z.number().nullable(),
  pointsUsed: z.number(),
  paymentMethod: z.string().min(1, '결제수단을 선택해주세요.'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// 💡 쿠폰 할인율(퍼센트)을 실제 할인 금액으로 환산할 때 쓰는 나눗셈 기준값.
const PERCENT_DIVISOR = 100;

export const useCheckout = () => {
  const { items, totalPrice, isLoading, clearCart } = useCart();
  const [orderedMessage, setOrderedMessage] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    number | null
  >(null);
  const [hasAutoFilledAddress, setHasAutoFilledAddress] = useState(false);

  const queryClient = useQueryClient();

  const { data: myCoupons = [] } = useQuery({
    queryKey: ['coupons', 'me'],
    queryFn: fetchMyCoupons,
    enabled: isLoggedIn(),
  });
  const usableCoupons = myCoupons.filter((coupon) => !coupon.usedAt);
  const { data: currentUser } = useCurrentUser();

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['addresses', 'me'],
    queryFn: fetchMyAddresses,
    enabled: isLoggedIn(),
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      recipientName: '',
      phonePrefix: '010',
      phoneMiddle: '',
      phoneLast: '',
      zipCode: '',
      address: '',
      addressDetail: '',
      saveAddressChecked: false,
      addressLabel: '',
      saveAsDefault: false,
      deliveryRequestOption: '',
      customDeliveryRequest: '',
      entryMethod: '',
      entryNote: '',
      selectedCouponId: null,
      pointsUsed: 0,
      paymentMethod: '',
    },
  });

  const formValues = watch();

  const applySavedAddress = (savedAddress: Address) => {
    setSelectedSavedAddressId(savedAddress.id);
    setValue('recipientName', savedAddress.recipientName, {
      shouldValidate: true,
    });
    const [prefix = '010', middle = '', last = ''] =
      savedAddress.recipientPhone.split('-');
    setValue('phonePrefix', prefix);
    setValue('phoneMiddle', middle, { shouldValidate: true });
    setValue('phoneLast', last, { shouldValidate: true });
    setValue('zipCode', savedAddress.zipCode, { shouldValidate: true });
    setValue('address', savedAddress.address, { shouldValidate: true });
    setValue('addressDetail', savedAddress.addressDetail ?? '');
  };

  // 💡 저장된 배송지가 있으면 기본 배송지(없으면 가장 최근 배송지)를 최초 1회만 자동으로 채워준다.
  // react-hook-form의 setValue는 useState setter와 달리 렌더링 중 호출이 안전하지 않은 명령형 API라,
  // 이 자동채움만 예외적으로 useEffect를 쓴다.
  useEffect(() => {
    if (!hasAutoFilledAddress && savedAddresses.length > 0) {
      setHasAutoFilledAddress(true);
      const defaultAddress =
        savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0];
      applySavedAddress(defaultAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses, hasAutoFilledAddress]);

  const handleDeleteSavedAddress = async (id: number) => {
    try {
      await deleteAddress(id);
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
      if (selectedSavedAddressId === id) {
        setSelectedSavedAddressId(null);
      }
    } catch {
      toast.error('배송지 삭제 중 오류가 발생했습니다.');
    }
  };

  const selectedCoupon = usableCoupons.find(
    (coupon) => coupon.id === formValues.selectedCouponId,
  );
  const discountAmount = selectedCoupon
    ? Math.floor(
        (totalPrice * selectedCoupon.discountPercent) / PERCENT_DIVISOR,
      )
    : 0;
  const availablePoints = currentUser?.points ?? 0;
  const maxUsablePoints = Math.max(
    0,
    Math.min(availablePoints, totalPrice - discountAmount),
  );
  // 💡 쿠폰을 바꿔 maxUsablePoints가 줄어들면 이미 입력해둔 pointsUsed가 초과될 수 있다.
  // effect로 state를 되돌리는 대신 렌더링 중에 상한선으로 계산해서 쓴다.
  const effectivePointsUsed = Math.min(formValues.pointsUsed, maxUsablePoints);

  const isTossSelected = formValues.paymentMethod === '토스페이먼츠';
  const { isReady: tossWidgetReady, requestPayment: requestTossPayment } =
    useTossPaymentWidget({
      enabled: isTossSelected,
      customerKey: currentUser?.email,
      initialAmount: Math.max(
        totalPrice - discountAmount - effectivePointsUsed,
        0,
      ),
    });

  const canSubmit = isValid && (!isTossSelected || tossWidgetReady);

  const onSubmit = async (values: CheckoutFormValues) => {
    // 💡 비회원은 계정 장바구니/주문 개념이 없으므로 화면상으로만 완료 처리한다.
    if (!isLoggedIn()) {
      clearCart();
      setOrderedMessage(true);
      return;
    }

    const deliveryRequest =
      values.deliveryRequestOption === '직접 입력'
        ? values.customDeliveryRequest.trim()
        : values.deliveryRequestOption;
    const showEntryNote =
      values.entryMethod === '비밀번호' || values.entryMethod === '기타사항';

    const orderParams = {
      recipientName: values.recipientName.trim(),
      recipientPhone: `${values.phonePrefix}-${values.phoneMiddle}-${values.phoneLast}`,
      zipCode: values.zipCode.trim(),
      address: values.address.trim(),
      addressDetail: values.addressDetail.trim() || undefined,
      paymentMethod: values.paymentMethod,
      couponId: values.selectedCouponId ?? undefined,
      deliveryRequest: deliveryRequest || undefined,
      entryMethod: values.entryMethod || undefined,
      entryNote: showEntryNote
        ? values.entryNote.trim() || undefined
        : undefined,
      pointsUsed: effectivePointsUsed,
    };

    setIsCheckingOut(true);
    try {
      // 💡 결제창 이동/주문 생성보다 먼저 저장한다 - 카카오페이는 이 시점 이후 페이지를 벗어난다.
      // 저장에 실패해도 주문 자체는 막지 않고 조용히 넘어간다.
      if (values.saveAddressChecked) {
        try {
          await saveAddress({
            label: values.addressLabel.trim() || undefined,
            recipientName: orderParams.recipientName,
            recipientPhone: orderParams.recipientPhone,
            zipCode: orderParams.zipCode,
            address: orderParams.address,
            addressDetail: orderParams.addressDetail,
            isDefault: values.saveAsDefault,
          });
          queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
        } catch {
          // 💡 배송지 저장 실패는 주문 흐름을 막지 않는다 — 대신 토스트로만 알려준다.
          toast.error('배송지 저장에 실패했습니다. 주문은 계속 진행됩니다.');
        }
      }

      if (values.paymentMethod === '카카오페이') {
        // 💡 카카오 결제창으로 이동 - 실제 주문은 결제 승인 후(/checkout/kakao/approve)에 생성된다.
        const { redirectUrl } = await readyKakaoPayment(orderParams);
        window.location.href = redirectUrl;
        return;
      }

      if (values.paymentMethod === '토스페이먼츠') {
        // 💡 백엔드가 계산한 authoritative 금액으로 위젯을 갱신한 뒤 결제창을 띄운다.
        // 실제 주문은 결제 승인 후(/checkout/toss/approve)에 생성된다.
        const { orderId, amount, orderName } =
          await prepareTossPayment(orderParams);
        await requestTossPayment({
          orderId,
          amount,
          orderName,
          successUrl: `${window.location.origin}/checkout/toss/approve`,
          failUrl: `${window.location.origin}/checkout/toss/fail`,
          customerName: values.recipientName.trim(),
          customerEmail: currentUser?.email,
        });
        return;
      }

      await createOrder(orderParams);
      clearCart();
      setOrderedMessage(true);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '주문 처리 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return {
    items,
    totalPrice,
    isLoading,
    orderedMessage,
    isCheckingOut,
    formValues,
    setValue,
    savedAddresses,
    selectedSavedAddressId,
    applySavedAddress,
    handleDeleteSavedAddress,
    usableCoupons,
    discountAmount,
    availablePoints,
    effectivePointsUsed,
    maxUsablePoints,
    isTossSelected,
    canSubmit,
    submitOrder: handleSubmit(onSubmit),
  };
};
