import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { CartItemRow } from '../components/CartItemRow/CartItemRow';
import { ShippingInfoForm } from '../components/ShippingInfoForm/ShippingInfoForm';
import { DeliveryRequestForm } from '../components/DeliveryRequestForm/DeliveryRequestForm';
import { CouponPointsForm } from '../components/CouponPointsForm/CouponPointsForm';
import { PaymentMethodForm } from '../components/PaymentMethodForm/PaymentMethodForm';
import { CheckoutSummary } from '../components/CheckoutSummary/CheckoutSummary';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../hooks/useCart';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { isLoggedIn } from '../api/authToken';
import { createOrder } from '../api/orderApi';
import { prepareTossPayment, readyKakaoPayment } from '../api/paymentApi';
import { fetchMyCoupons } from '../api/couponApi';
import { deleteAddress, fetchMyAddresses, saveAddress } from '../api/addressApi';
import type { Address } from '../types/address';
import { useTossPaymentWidget, TOSS_PAYMENT_METHODS_SELECTOR, TOSS_AGREEMENT_SELECTOR } from '../hooks/useTossPaymentWidget';
import styles from './Checkout.module.css';

export const Checkout = () => {
  const { items, totalPrice, isLoading, clearCart } = useCart();
  const [orderedMessage, setOrderedMessage] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('010');
  const [phoneMiddle, setPhoneMiddle] = useState('');
  const [phoneLast, setPhoneLast] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | null>(null);
  const [hasAutoFilledAddress, setHasAutoFilledAddress] = useState(false);
  const [saveAddressChecked, setSaveAddressChecked] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const [deliveryRequestOption, setDeliveryRequestOption] = useState('');
  const [customDeliveryRequest, setCustomDeliveryRequest] = useState('');
  const [entryMethod, setEntryMethod] = useState('');
  const [entryNote, setEntryNote] = useState('');

  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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

  const applySavedAddress = (savedAddress: Address) => {
    setSelectedSavedAddressId(savedAddress.id);
    setRecipientName(savedAddress.recipientName);
    const [prefix = '010', middle = '', last = ''] = savedAddress.recipientPhone.split('-');
    setPhonePrefix(prefix);
    setPhoneMiddle(middle);
    setPhoneLast(last);
    setZipCode(savedAddress.zipCode);
    setAddress(savedAddress.address);
    setAddressDetail(savedAddress.addressDetail ?? '');
  };

  // 💡 저장된 배송지가 있으면 기본 배송지(없으면 가장 최근 배송지)를 최초 1회만 자동으로 채워준다.
  // effect 대신 렌더링 중에 아직 채우지 않았고 데이터가 막 도착했을 때만 채운다.
  if (!hasAutoFilledAddress && savedAddresses.length > 0) {
    setHasAutoFilledAddress(true);
    const defaultAddress = savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0];
    applySavedAddress(defaultAddress);
  }

  const handleDeleteSavedAddress = async (id: number) => {
    try {
      await deleteAddress(id);
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
      if (selectedSavedAddressId === id) {
        setSelectedSavedAddressId(null);
      }
    } catch {
      setCheckoutError('배송지 삭제 중 오류가 발생했습니다.');
    }
  };

  const selectedCoupon = usableCoupons.find((coupon) => coupon.id === selectedCouponId);
  const discountAmount = selectedCoupon ? Math.floor((totalPrice * selectedCoupon.discountPercent) / 100) : 0;
  const availablePoints = currentUser?.points ?? 0;
  const maxUsablePoints = Math.max(0, Math.min(availablePoints, totalPrice - discountAmount));
  // 💡 쿠폰을 바꿔 maxUsablePoints가 줄어들면 이미 입력해둔 pointsUsed가 초과될 수 있다.
  // effect로 state를 되돌리는 대신 렌더링 중에 상한선으로 계산해서 쓴다.
  const effectivePointsUsed = Math.min(pointsUsed, maxUsablePoints);

  const isTossSelected = paymentMethod === '토스페이먼츠';
  const { isReady: tossWidgetReady, requestPayment: requestTossPayment } = useTossPaymentWidget({
    enabled: isTossSelected,
    customerKey: currentUser?.email,
    initialAmount: Math.max(totalPrice - discountAmount - effectivePointsUsed, 0),
  });

  const canSubmit = Boolean(
    recipientName.trim() &&
      phoneMiddle.length === 4 &&
      phoneLast.length === 4 &&
      zipCode.trim() &&
      address.trim() &&
      paymentMethod &&
      (!isTossSelected || tossWidgetReady)
  );

  const handleCheckout = async () => {
    setCheckoutError(null);

    // 💡 비회원은 계정 장바구니/주문 개념이 없으므로 화면상으로만 완료 처리한다.
    if (!isLoggedIn()) {
      clearCart();
      setOrderedMessage(true);
      return;
    }

    if (!canSubmit) return;

    const deliveryRequest =
      deliveryRequestOption === '직접 입력' ? customDeliveryRequest.trim() : deliveryRequestOption;
    const showEntryNote = entryMethod === '비밀번호' || entryMethod === '기타사항';

    const orderParams = {
      recipientName: recipientName.trim(),
      recipientPhone: `${phonePrefix}-${phoneMiddle}-${phoneLast}`,
      zipCode: zipCode.trim(),
      address: address.trim(),
      addressDetail: addressDetail.trim() || undefined,
      paymentMethod,
      couponId: selectedCouponId ?? undefined,
      deliveryRequest: deliveryRequest || undefined,
      entryMethod: entryMethod || undefined,
      entryNote: showEntryNote ? entryNote.trim() || undefined : undefined,
      pointsUsed: effectivePointsUsed,
    };

    setIsCheckingOut(true);
    try {
      // 💡 결제창 이동/주문 생성보다 먼저 저장한다 - 카카오페이는 이 시점 이후 페이지를 벗어난다.
      // 저장에 실패해도 주문 자체는 막지 않고 조용히 넘어간다.
      if (saveAddressChecked) {
        try {
          await saveAddress({
            label: addressLabel.trim() || undefined,
            recipientName: orderParams.recipientName,
            recipientPhone: orderParams.recipientPhone,
            zipCode: orderParams.zipCode,
            address: orderParams.address,
            addressDetail: orderParams.addressDetail,
            isDefault: saveAsDefault,
          });
          queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
        } catch {
          // 배송지 저장 실패는 주문 흐름을 막지 않는다.
        }
      }

      if (paymentMethod === '카카오페이') {
        // 💡 카카오 결제창으로 이동 - 실제 주문은 결제 승인 후(/checkout/kakao/approve)에 생성된다.
        const { redirectUrl } = await readyKakaoPayment(orderParams);
        window.location.href = redirectUrl;
        return;
      }

      if (paymentMethod === '토스페이먼츠') {
        // 💡 백엔드가 계산한 authoritative 금액으로 위젯을 갱신한 뒤 결제창을 띄운다.
        // 실제 주문은 결제 승인 후(/checkout/toss/approve)에 생성된다.
        const { orderId, amount, orderName } = await prepareTossPayment(orderParams);
        await requestTossPayment({
          orderId,
          amount,
          orderName,
          successUrl: `${window.location.origin}/checkout/toss/approve`,
          failUrl: `${window.location.origin}/checkout/toss/fail`,
          customerName: recipientName.trim(),
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
      setCheckoutError(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!orderedMessage && !isLoading && items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>주문/결제</h1>

        {orderedMessage ? (
          <div className={styles.empty}>
            <p>🎉 주문이 완료되었습니다!</p>
            <Link to="/" className={styles.backLink}>
              ← 쇼핑 계속하기
            </Link>
          </div>
        ) : isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : (
          <div className={styles.layout}>
            <div>
              <ShippingInfoForm
                recipientName={recipientName}
                onRecipientNameChange={setRecipientName}
                phonePrefix={phonePrefix}
                onPhonePrefixChange={setPhonePrefix}
                phoneMiddle={phoneMiddle}
                onPhoneMiddleChange={setPhoneMiddle}
                phoneLast={phoneLast}
                onPhoneLastChange={setPhoneLast}
                zipCode={zipCode}
                onZipCodeChange={setZipCode}
                address={address}
                onAddressChange={setAddress}
                addressDetail={addressDetail}
                onAddressDetailChange={setAddressDetail}
                savedAddresses={savedAddresses}
                selectedSavedAddressId={selectedSavedAddressId}
                onSelectSavedAddress={applySavedAddress}
                onDeleteSavedAddress={handleDeleteSavedAddress}
                showSaveOption={isLoggedIn()}
                saveAddress={saveAddressChecked}
                onSaveAddressChange={setSaveAddressChecked}
                addressLabel={addressLabel}
                onAddressLabelChange={setAddressLabel}
                saveAsDefault={saveAsDefault}
                onSaveAsDefaultChange={setSaveAsDefault}
              />

              <DeliveryRequestForm
                deliveryRequestOption={deliveryRequestOption}
                onDeliveryRequestOptionChange={setDeliveryRequestOption}
                customDeliveryRequest={customDeliveryRequest}
                onCustomDeliveryRequestChange={setCustomDeliveryRequest}
                entryMethod={entryMethod}
                onEntryMethodChange={setEntryMethod}
                entryNote={entryNote}
                onEntryNoteChange={setEntryNote}
              />

              <section className={styles.itemsSection}>
                <h2 className={styles.sectionTitle}>배송 상품 정보</h2>
                <div className={styles.items}>
                  {items.map((item) => (
                    <CartItemRow key={item.cartItemId} item={item} readOnly />
                  ))}
                </div>
                <Link to="/cart" className={styles.backLink}>
                  ← 장바구니로 돌아가기
                </Link>
              </section>

              <CouponPointsForm
                coupons={usableCoupons}
                selectedCouponId={selectedCouponId}
                onCouponChange={setSelectedCouponId}
                discountAmount={discountAmount}
                availablePoints={availablePoints}
                pointsUsed={effectivePointsUsed}
                maxUsablePoints={maxUsablePoints}
                onPointsUsedChange={setPointsUsed}
              />

              <PaymentMethodForm paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} />
              {isTossSelected && (
                <section className={styles.itemsSection}>
                  <div id={TOSS_PAYMENT_METHODS_SELECTOR.slice(1)} />
                  <div id={TOSS_AGREEMENT_SELECTOR.slice(1)} />
                </section>
              )}
            </div>

            <div>
              {checkoutError && <p className={styles.checkoutError}>{checkoutError}</p>}
              <CheckoutSummary
                totalPrice={totalPrice}
                discountAmount={discountAmount}
                pointsUsed={effectivePointsUsed}
                canSubmit={canSubmit}
                agreeToTerms={agreeToTerms}
                onAgreeToTermsChange={setAgreeToTerms}
                onCheckout={handleCheckout}
                isSubmitting={isCheckingOut}
              />
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
