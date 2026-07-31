import styles from './PerksBar.module.css';

export interface Perk {
  icon: string;
  title: string;
  description: string;
}

interface PerksBarProps {
  perks: Perk[];
}

export const PerksBar = ({ perks }: PerksBarProps) => {
  return (
    <section className={styles.perks}>
      {perks.map((perk) => (
        <div key={perk.title}>
          <span className={styles.perkIcon}>{perk.icon}</span>
          <strong>{perk.title}</strong>
          <span>{perk.description}</span>
        </div>
      ))}
    </section>
  );
};
