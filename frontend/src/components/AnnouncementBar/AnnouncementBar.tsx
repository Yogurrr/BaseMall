import type { ReactNode } from 'react';
import styles from './AnnouncementBar.module.css';

interface AnnouncementBarProps {
  message: ReactNode;
}

export const AnnouncementBar = ({ message }: AnnouncementBarProps) => {
  return <div className={styles.bar}>{message}</div>;
};
