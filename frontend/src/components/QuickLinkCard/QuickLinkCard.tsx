import { Link } from 'react-router-dom';
import styles from './QuickLinkCard.module.css';

interface QuickLinkCardProps {
  icon: string;
  label: string;
  description: string;
  to: string;
}

export const QuickLinkCard = ({ icon, label, description, to }: QuickLinkCardProps) => {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.description}>{description}</span>
      <span className={styles.arrow}>→</span>
    </Link>
  );
};
