import type { ReactNode } from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  icon: string;
  title?: string | null;
  children: ReactNode;
}

export const StatusMessage = ({
  icon,
  title,
  children,
}: StatusMessageProps) => (
  <div className={styles.wrap}>
    <span className={styles.icon}>{icon}</span>
    {title && <p className={styles.title}>{title}</p>}
    <p className={styles.text}>{children}</p>
  </div>
);
