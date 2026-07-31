import { useEffect, useState, type FormEvent } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  size?: 'sm' | 'lg';
  onSearch: (keyword: string) => void;
}

export const SearchBar = ({ defaultValue = '', placeholder = '검색어를 입력하세요', size = 'sm', onSearch }: SearchBarProps) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

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
