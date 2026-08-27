import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number;
}

export const Spinner = ({ size = 32 }: SpinnerProps) => (
  <svg
    className={styles.spinner}
    style={{ width: size, height: size }}
    viewBox="0 0 32 32"
    role="status"
    aria-label="로딩 중"
  >
    <circle
      cx="16"
      cy="16"
      r="14"
      fill="#fff"
      stroke="#c0392b"
      strokeWidth="1"
    />
    <path
      d="M 6 4 A 15 15 0 0 0 6 28"
      fill="none"
      stroke="#c0392b"
      strokeWidth="1.5"
    />
    <path
      d="M 26 4 A 15 15 0 0 1 26 28"
      fill="none"
      stroke="#c0392b"
      strokeWidth="1.5"
    />
    {[3, 8, 13, 19, 24, 29].map((y) => (
      <g key={`l-${y}`}>
        <line
          x1="4.5"
          y1={y - 1.2}
          x2="7.5"
          y2={y + 1.2}
          stroke="#c0392b"
          strokeWidth="1"
        />
        <line
          x1="4.5"
          y1={y + 1.2}
          x2="7.5"
          y2={y - 1.2}
          stroke="#c0392b"
          strokeWidth="1"
        />
      </g>
    ))}
    {[3, 8, 13, 19, 24, 29].map((y) => (
      <g key={`r-${y}`}>
        <line
          x1="24.5"
          y1={y - 1.2}
          x2="27.5"
          y2={y + 1.2}
          stroke="#c0392b"
          strokeWidth="1"
        />
        <line
          x1="24.5"
          y1={y + 1.2}
          x2="27.5"
          y2={y - 1.2}
          stroke="#c0392b"
          strokeWidth="1"
        />
      </g>
    ))}
  </svg>
);
