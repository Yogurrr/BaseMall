import styles from './ProductThumb.module.css';

interface ProductThumbProps {
  imageUrl?: string | null;
  alt: string;
  size?: 'lg' | 'sm';
}

export const ProductThumb = ({
  imageUrl,
  alt,
  size = 'lg',
}: ProductThumbProps) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`${styles.image} ${styles[size]}`}
      />
    );
  }

  return (
    <span
      className={`${styles.placeholder} ${styles[size]}`}
      role="img"
      aria-label={alt}
    >
      📦
    </span>
  );
};
