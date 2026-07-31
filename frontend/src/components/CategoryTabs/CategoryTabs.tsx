import styles from './CategoryTabs.module.css';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
  sectionId?: string;
}

export const CategoryTabs = ({ categories, active, onSelect, sectionId }: CategoryTabsProps) => {
  return (
    <section id={sectionId} className={styles.categories}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`${styles.chip} ${active === category ? styles.chipActive : ''}`}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </section>
  );
};
