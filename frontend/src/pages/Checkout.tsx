import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { CartItemRow } from '../components/CartItemRow/CartItemRow';
import { ShippingInfoForm } from '../components/ShippingInfoForm/ShippingInfoForm';
import { DeliveryRequestForm } from '../components/DeliveryRequestForm/DeliveryRequestForm';
import { CouponPointsForm } from '../components/CouponPointsForm/CouponPointsForm';
import { PaymentMethodForm } from '../components/PaymentMethodForm/PaymentMethodForm';
import { CheckoutSummary } from '../components/CheckoutSummary/CheckoutSummary';
import { Spinner } from '../components/Spinner/Spinner';
import { useCheckout } from '../hooks/useCheckout';
import { isLoggedIn } from '../api/authToken';
import {
  TOSS_PAYMENT_METHODS_SELECTOR,
  TOSS_AGREEMENT_SELECTOR,
} from '../hooks/useTossPaymentWidget';
import styles from './Checkout.module.css';

export const Checkout = () => {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const {
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
    submitOrder,
  } = useCheckout();

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
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : (
          <div className={styles.layout}>
            <div>
              <ShippingInfoForm
                recipientName={formValues.recipientName}
                onRecipientNameChange={(v) =>
                  setValue('recipientName', v, { shouldValidate: true })
                }
                phonePrefix={formValues.phonePrefix}
                onPhonePrefixChange={(v) => setValue('phonePrefix', v)}
                phoneMiddle={formValues.phoneMiddle}
                onPhoneMiddleChange={(v) =>
                  setValue('phoneMiddle', v, { shouldValidate: true })
                }
                phoneLast={formValues.phoneLast}
                onPhoneLastChange={(v) =>
                  setValue('phoneLast', v, { shouldValidate: true })
                }
                zipCode={formValues.zipCode}
                onZipCodeChange={(v) =>
                  setValue('zipCode', v, { shouldValidate: true })
                }
                address={formValues.address}
                onAddressChange={(v) =>
                  setValue('address', v, { shouldValidate: true })
                }
                addressDetail={formValues.addressDetail}
                onAddressDetailChange={(v) => setValue('addressDetail', v)}
                savedAddresses={savedAddresses}
                selectedSavedAddressId={selectedSavedAddressId}
                onSelectSavedAddress={applySavedAddress}
                onDeleteSavedAddress={handleDeleteSavedAddress}
                showSaveOption={isLoggedIn()}
                saveAddress={formValues.saveAddressChecked}
                onSaveAddressChange={(v) => setValue('saveAddressChecked', v)}
                addressLabel={formValues.addressLabel}
                onAddressLabelChange={(v) => setValue('addressLabel', v)}
                saveAsDefault={formValues.saveAsDefault}
                onSaveAsDefaultChange={(v) => setValue('saveAsDefault', v)}
              />

              <DeliveryRequestForm
                deliveryRequestOption={formValues.deliveryRequestOption}
                onDeliveryRequestOptionChange={(v) =>
                  setValue('deliveryRequestOption', v)
                }
                customDeliveryRequest={formValues.customDeliveryRequest}
                onCustomDeliveryRequestChange={(v) =>
                  setValue('customDeliveryRequest', v)
                }
                entryMethod={formValues.entryMethod}
                onEntryMethodChange={(v) => setValue('entryMethod', v)}
                entryNote={formValues.entryNote}
                onEntryNoteChange={(v) => setValue('entryNote', v)}
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
                selectedCouponId={formValues.selectedCouponId}
                onCouponChange={(couponId) =>
                  setValue('selectedCouponId', couponId)
                }
                discountAmount={discountAmount}
                availablePoints={availablePoints}
                pointsUsed={effectivePointsUsed}
                maxUsablePoints={maxUsablePoints}
                onPointsUsedChange={(v) => setValue('pointsUsed', v)}
              />

              <PaymentMethodForm
                paymentMethod={formValues.paymentMethod}
                onPaymentMethodChange={(v) =>
                  setValue('paymentMethod', v, { shouldValidate: true })
                }
              />
              {isTossSelected && (
                <section className={styles.itemsSection}>
                  <div id={TOSS_PAYMENT_METHODS_SELECTOR.slice(1)} />
                  <div id={TOSS_AGREEMENT_SELECTOR.slice(1)} />
                </section>
              )}
            </div>

            <div>
              <CheckoutSummary
                totalPrice={totalPrice}
                discountAmount={discountAmount}
                pointsUsed={effectivePointsUsed}
                canSubmit={canSubmit}
                agreeToTerms={agreeToTerms}
                onAgreeToTermsChange={setAgreeToTerms}
                onCheckout={submitOrder}
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
