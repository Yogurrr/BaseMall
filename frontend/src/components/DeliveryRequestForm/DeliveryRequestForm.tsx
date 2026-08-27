import { ENTRY_METHODS } from '../../api/orderApi';
import styles from './DeliveryRequestForm.module.css';

const DELIVERY_REQUEST_OPTIONS = [
  '문 앞에 놓아주세요',
  '부재 시 연락 부탁드려요',
  '배송 전 미리 연락해주세요',
  '직접 입력',
] as const;

interface DeliveryRequestFormProps {
  deliveryRequestOption: string;
  onDeliveryRequestOptionChange: (value: string) => void;
  customDeliveryRequest: string;
  onCustomDeliveryRequestChange: (value: string) => void;
  entryMethod: string;
  onEntryMethodChange: (value: string) => void;
  entryNote: string;
  onEntryNoteChange: (value: string) => void;
}

export const DeliveryRequestForm = ({
  deliveryRequestOption,
  onDeliveryRequestOptionChange,
  customDeliveryRequest,
  onCustomDeliveryRequestChange,
  entryMethod,
  onEntryMethodChange,
  entryNote,
  onEntryNoteChange,
}: DeliveryRequestFormProps) => {
  const showEntryNote =
    entryMethod === '비밀번호' || entryMethod === '기타사항';
  const entryNoteLabel =
    entryMethod === '기타사항' ? '기타사항' : '공동현관 비밀번호';

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>배송 요청사항</h2>
      <div className={styles.table}>
        <div className={styles.row}>
          <div className={styles.label}>배송 메시지</div>
          <div className={styles.valueColumn}>
            <select
              value={deliveryRequestOption}
              onChange={(e) => onDeliveryRequestOptionChange(e.target.value)}
            >
              <option value="">배송 메시지를 선택해주세요.</option>
              {DELIVERY_REQUEST_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {deliveryRequestOption === '직접 입력' && (
              <input
                value={customDeliveryRequest}
                onChange={(e) => onCustomDeliveryRequestChange(e.target.value)}
                placeholder="요청사항을 입력하세요"
              />
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>공동현관 출입방법</div>
          <div className={styles.value}>
            {ENTRY_METHODS.map((method) => (
              <label key={method} className={styles.radioOption}>
                <input
                  type="radio"
                  name="entryMethod"
                  value={method}
                  checked={entryMethod === method}
                  onChange={() => onEntryMethodChange(method)}
                />
                {method}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>{entryNoteLabel}</div>
          <div className={styles.value}>
            {showEntryNote ? (
              <input
                value={entryNote}
                onChange={(e) => onEntryNoteChange(e.target.value)}
                placeholder={
                  entryMethod === '기타사항'
                    ? '출입 방법을 입력하세요'
                    : '예) #1234#'
                }
              />
            ) : (
              <span className={styles.muted}>-</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
