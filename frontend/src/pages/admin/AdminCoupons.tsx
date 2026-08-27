import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/Button/Button';
import { issueCouponsByGrade } from '../../api/couponApi';
import styles from './Admin.module.css';

const GRADES = [
  { key: 'Rookie', label: 'Rookie (3%)' },
  { key: 'Starter', label: 'Starter (5%)' },
  { key: 'All-Star', label: 'All-Star (8%)' },
  { key: 'MVP', label: 'MVP (12%)' },
];

export const AdminCoupons = () => {
  const mutation = useMutation({ mutationFn: issueCouponsByGrade });

  return (
    <>
      <h1>쿠폰 관리</h1>

      <section className={styles.stats}>
        {GRADES.map((grade) => (
          <div key={grade.key} className={styles.statCard}>
            <span>{grade.label}</span>
            <Button
              isLoading={mutation.isPending && mutation.variables === grade.key}
              onClick={() => mutation.mutate(grade.key)}
            >
              등급별 쿠폰 발급
            </Button>
          </div>
        ))}
      </section>

      {mutation.isSuccess && (
        <p>
          {mutation.variables} 등급 회원 {mutation.data.issuedCount}명에게
          쿠폰을 발급했습니다.
        </p>
      )}
      {mutation.isError && (
        <p className={styles.error}>쿠폰 발급에 실패했습니다.</p>
      )}
    </>
  );
};
