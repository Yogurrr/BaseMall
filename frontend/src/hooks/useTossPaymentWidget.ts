import { useEffect, useRef, useState } from 'react';
import { ANONYMOUS, loadPaymentWidget } from '@tosspayments/payment-widget-sdk';
import type { PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

export const TOSS_PAYMENT_METHODS_SELECTOR = '#toss-payment-methods';
export const TOSS_AGREEMENT_SELECTOR = '#toss-agreement';

type PaymentMethodsWidget = ReturnType<
  PaymentWidgetInstance['renderPaymentMethods']
>;

interface UseTossPaymentWidgetOptions {
  enabled: boolean;
  customerKey?: string;
  initialAmount: number;
}

interface RequestTossPaymentParams {
  orderId: string;
  orderName: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  customerName?: string;
  customerEmail?: string;
}

// 💡 토스페이먼츠 결제위젯의 mount~unmount 라이프사이클을 캡슐화한다. enabled가 true일 때만
// 위젯을 로드/렌더링하고, requestPayment 호출 시 authoritative 금액으로 updateAmount 후
// 바로 결제를 요청해 호출부가 순서를 틀릴 수 없게 한다.
export const useTossPaymentWidget = ({
  enabled,
  customerKey,
  initialAmount,
}: UseTossPaymentWidgetOptions) => {
  const [isReady, setIsReady] = useState(false);
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const methodsWidgetRef = useRef<PaymentMethodsWidget | null>(null);

  useEffect(() => {
    if (!enabled) {
      widgetRef.current = null;
      methodsWidgetRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 토스 결제위젯(외부 SDK)의 준비 상태를 껐다 켜는 동기화라 effect 밖에서 계산할 수 없다.
      setIsReady(false);
      return;
    }

    let cancelled = false;
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string;

    loadPaymentWidget(clientKey, customerKey || ANONYMOUS).then((widget) => {
      if (cancelled) return;
      widgetRef.current = widget;
      methodsWidgetRef.current = widget.renderPaymentMethods(
        TOSS_PAYMENT_METHODS_SELECTOR,
        initialAmount,
      );
      widget.renderAgreement(TOSS_AGREEMENT_SELECTOR);
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      widgetRef.current = null;
      methodsWidgetRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialAmount는 최초 렌더링에만 쓰고, 실제 청구 금액은 requestPayment 시점에 updateAmount로 동기화한다.
  }, [enabled, customerKey]);

  const requestPayment = async (params: RequestTossPaymentParams) => {
    if (!widgetRef.current) {
      throw new Error('결제 위젯이 아직 준비되지 않았습니다.');
    }
    methodsWidgetRef.current?.updateAmount(params.amount);
    await widgetRef.current.requestPayment({
      orderId: params.orderId,
      orderName: params.orderName,
      successUrl: params.successUrl,
      failUrl: params.failUrl,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
    });
  };

  return { isReady, requestPayment };
};
