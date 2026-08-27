import { useQuery } from '@tanstack/react-query';
import { QnaListPanel } from '../../components/QnaListPanel/QnaListPanel';
import { fetchMyQnas } from '../../api/qnaApi';
import styles from './MyPage.module.css';

export const MyPageQna = () => {
  const { data: qnas = [] } = useQuery({
    queryKey: ['qna', 'me'],
    queryFn: fetchMyQnas,
  });

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>상품 Q&A 내역 {qnas.length}건</p>
      <QnaListPanel qnas={qnas} emptyMessage="작성한 상품 Q&A가 없습니다." />
    </div>
  );
};
