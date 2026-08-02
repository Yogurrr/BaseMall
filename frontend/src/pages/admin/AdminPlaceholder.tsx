import { useParams } from 'react-router-dom';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { ADMIN_MENU } from '../../components/AdminSidebar/AdminSidebar';
import styles from './Admin.module.css';

export const AdminPlaceholder = () => {
  const { section } = useParams<{ section: string }>();
  const label = ADMIN_MENU.find((item) => item.key === section)?.label ?? '';

  return (
    <div className={styles.comingSoon}>
      <StatusMessage icon="🚧" title={label}>
        이 기능은 준비 중입니다.
      </StatusMessage>
    </div>
  );
};
