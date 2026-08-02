import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../Button/Button';
import styles from './StockEditor.module.css';

interface StockEditorProps {
  value: number;
  onSave: (value: number) => void;
  isSaving?: boolean;
}

export const StockEditor = ({ value, onSave, isSaving }: StockEditorProps) => {
  const [input, setInput] = useState(String(value));

  useEffect(() => {
    setInput(String(value));
  }, [value]);

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
