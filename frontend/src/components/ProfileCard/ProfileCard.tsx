import styles from './ProfileCard.module.css';

interface ProfileCardProps {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const ProfileCard = ({ name, email, role }: ProfileCardProps) => {
  return (
    <section className={styles.card}>
      <div className={styles.avatar}>{name.charAt(0)}</div>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{name}</h1>
          <span
            className={`${styles.badge} ${role === 'ADMIN' ? styles.badgeAdmin : ''}`}
          >
            {role === 'ADMIN' ? '관리자' : '일반회원'}
          </span>
        </div>
        <p className={styles.email}>{email}</p>
      </div>
    </section>
  );
};
