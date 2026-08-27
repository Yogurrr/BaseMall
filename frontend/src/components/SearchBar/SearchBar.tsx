import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './SearchBar.module.css';

const searchSchema = z.object({
  keyword: z.string(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  size?: 'sm' | 'lg';
  onSearch: (keyword: string) => void;
}

export const SearchBar = ({
  defaultValue = '',
  placeholder = '검색어를 입력하세요',
  size = 'sm',
  onSearch,
}: SearchBarProps) => {
  const { register, handleSubmit, reset } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { keyword: defaultValue },
  });

  // 💡 defaultValue(상위 검색어)가 바뀌면 입력값도 맞춰야 하는데, effect 대신 렌더링 중에
  // 이전 값과 비교해 바뀐 경우에만 조정한다(React 문서의 "prop이 바뀔 때 state를 조정하기" 패턴).
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    reset({ keyword: defaultValue });
  }

  const onSubmit = (values: SearchFormValues) => {
    const trimmed = values.keyword.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form
      className={`${styles.form} ${styles[size]}`}
      onSubmit={handleSubmit(onSubmit)}
      role="search"
      noValidate
    >
      <span className={styles.icon}>🔍</span>
      <input
        className={styles.input}
        type="search"
        {...register('keyword')}
        placeholder={placeholder}
        aria-label="상품 검색"
      />
      {size === 'lg' && (
        <button type="submit" className={styles.button}>
          검색
        </button>
      )}
    </form>
  );
};
