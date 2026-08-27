import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../Button/Button';
import styles from './StockEditor.module.css';

const stockSchema = z.object({
  stock: z.string(),
});

type StockFormValues = z.infer<typeof stockSchema>;

interface StockEditorProps {
  value: number;
  onSave: (value: number) => void;
  isSaving?: boolean;
}

export const StockEditor = ({ value, onSave, isSaving }: StockEditorProps) => {
  const { register, handleSubmit, watch, reset } = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: { stock: String(value) },
  });

  // 💡 value(서버에 저장된 재고)가 바뀌면 입력값도 맞춰야 하는데, effect 대신 렌더링 중에
  // 이전 값과 비교해 바뀐 경우에만 조정한다(React 문서의 "prop이 바뀔 때 state를 조정하기" 패턴).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    reset({ stock: String(value) });
  }

  const input = watch('stock');
  const nextValue = Math.max(0, Math.floor(Number(input) || 0));

  const onSubmit = () => {
    if (nextValue === value) return;
    onSave(nextValue);
  };

  return (
    <form
      className={styles.editor}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <input
        type="number"
        min="0"
        className={`${styles.input} ${value === 0 ? styles.outOfStock : value <= 5 ? styles.lowStock : ''}`}
        {...register('stock')}
        aria-label="재고 수량"
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        isLoading={isSaving}
        disabled={nextValue === value}
      >
        저장
      </Button>
    </form>
  );
};
