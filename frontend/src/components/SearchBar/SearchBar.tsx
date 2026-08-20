import { useState, type FormEvent } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  size?: 'sm' | 'lg';
  onSearch: (keyword: string) => void;
}

export const SearchBar = ({ defaultValue = '', placeholder = '검색어를 입력하세요', size = 'sm', onSearch }: SearchBarProps) => {
  // 💡 defaultValue(상위 검색어)가 바뀌면 입력값도 맞춰야 하는데, effect 대신 렌더링 중에
  // 이전 값과 비교해 바뀐 경우에만 조정한다(React 문서의 "prop이 바뀔 때 state를 조정하기" 패턴).
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [value, setValue] = useState(defaultValue);
  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setValue(defaultValue);
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form className={`${styles.form} ${styles[size]}`} onSubmit={handleSubmit} role="search">
      <span className={styles.icon}>🔍</span>
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
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
