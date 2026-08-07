import { PAYMENT_METHODS } from '../../api/orderApi';
import styles from './PaymentMethodForm.module.css';

interface PaymentMethodFormProps {
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
}

export const PaymentMethodForm = ({ paymentMethod, onPaymentMethodChange }: PaymentMethodFormProps) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>결제수단 선택</h2>
      <div className={styles.grid}>
        {PAYMENT_METHODS.map((method) => (
          <label key={method} className={styles.option}>
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={paymentMethod === method}
              onChange={() => onPaymentMethodChange(method)}
            />
            {method}
          </label>
        ))}
      </div>
    </section>
  );
};
