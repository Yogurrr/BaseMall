import styles from './SelectFilter.module.css';

interface SelectFilterProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  sectionId?: string;
}

export const SelectFilter = ({
  options,
  value,
  onChange,
  sectionId,
}: SelectFilterProps) => (
  <section id={sectionId} className={styles.wrapper}>
    <select
      className={styles.select}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </section>
);
