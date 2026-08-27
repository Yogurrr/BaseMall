import { ProductThumb } from '../ProductThumb/ProductThumb';
import styles from './ProductImageUploader.module.css';

interface ProductImageUploaderProps {
  imagePreview: string | null;
  onFileChange: (file: File | null) => void;
}

export const ProductImageUploader = ({
  imagePreview,
  onFileChange,
}: ProductImageUploaderProps) => (
  <label className={styles.dropzone}>
    <div className={styles.thumbBox}>
      <ProductThumb
        imageUrl={imagePreview}
        alt="상품 이미지 미리보기"
        size="lg"
      />
    </div>
    <span className={styles.hint}>
      {imagePreview ? '이미지 변경' : '클릭해서 이미지 선택'}
    </span>
    <input
      type="file"
      accept="image/*"
      className={styles.input}
      onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
    />
  </label>
);
