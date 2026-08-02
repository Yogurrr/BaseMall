import { useParams } from 'react-router-dom';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { MYPAGE_MENU } from '../../components/MyPageSidebar/MyPageSidebar';
import styles from './MyPage.module.css';

export const MyPagePlaceholder = () => {
  const { section } = useParams<{ section: string }>();
  const label = MYPAGE_MENU.flatMap((group) => group.items).find((item) => item.key === section)?.label ?? '';

  return (
    <div className={styles.comingSoon}>
      <StatusMessage icon="🚧" title={label}>
        이 기능은 준비 중입니다.
      </StatusMessage>
    </div>
  );
};
