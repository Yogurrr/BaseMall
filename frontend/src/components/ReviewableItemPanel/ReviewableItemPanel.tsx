import { Link } from 'react-router-dom';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import type { ReviewableItem } from '../../types/review';
import buttonStyles from '../Button/Button.module.css';
import styles from './ReviewableItemPanel.module.css';

interface ReviewableItemPanelProps {
  items: ReviewableItem[];
}

// 💡 구매했지만 아직 리뷰를 안 쓴 상품이 없으면 섹션 자체를 숨긴다("내가 쓴 리뷰"만 봐도 충분).
export const ReviewableItemPanel = ({ items }: ReviewableItemPanelProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>리뷰를 기다리는 상품 {items.length}건</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.productId} className={styles.card}>
            <Link to={`/products/${item.productId}`} className={styles.thumb}>
              <ProductThumb imageUrl={item.productImageUrl} alt={item.productName} size="lg" />
            </Link>
            <Link to={`/products/${item.productId}`} className={styles.productName}>
              {item.productName}
            </Link>
            <Link
              to={`/products/${item.productId}`}
              className={`${buttonStyles.button} ${buttonStyles.outline} ${buttonStyles.sm} ${styles.writeButton}`}
            >
              리뷰 쓰러가기
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
