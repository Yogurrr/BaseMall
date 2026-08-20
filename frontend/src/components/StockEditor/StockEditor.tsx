import { useState, type FormEvent } from 'react';
import { Button } from '../Button/Button';
import styles from './StockEditor.module.css';

interface StockEditorProps {
  value: number;
  onSave: (value: number) => void;
  isSaving?: boolean;
}

export const StockEditor = ({ value, onSave, isSaving }: StockEditorProps) => {
  // 💡 value(서버에 저장된 재고)가 바뀌면 입력값도 맞춰야 하는데, effect 대신 렌더링 중에
  // 이전 값과 비교해 바뀐 경우에만 조정한다(React 문서의 "prop이 바뀔 때 state를 조정하기" 패턴).
  const [prevValue, setPrevValue] = useState(value);
  const [input, setInput] = useState(String(value));
  if (value !== prevValue) {
    setPrevValue(value);
    setInput(String(value));
  }

  const nextValue = Math.max(0, Math.floor(Number(input) || 0));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (nextValue === value) return;
    onSave(nextValue);
  };

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <input
        type="number"
        min="0"
        className={`${styles.input} ${value === 0 ? styles.outOfStock : value <= 5 ? styles.lowStock : ''}`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="재고 수량"
      />
      <Button type="submit" size="sm" variant="outline" isLoading={isSaving} disabled={nextValue === value}>
        저장
      </Button>
    </form>
  );
};
