import styles from './CheckboxFilterGroup.module.css';

interface CheckboxFilterGroupProps {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

export const CheckboxFilterGroup = ({ label, options, selected, onToggle }: CheckboxFilterGroupProps) => (
  <div className={styles.group}>
    <p className={styles.groupLabel}>{label}</p>
    <div className={styles.options}>
      {options.map((option) => (
        <label key={option} className={styles.option}>
          <input type="checkbox" checked={selected.has(option)} onChange={() => onToggle(option)} />
          {option}
        </label>
      ))}
    </div>
  </div>
);
