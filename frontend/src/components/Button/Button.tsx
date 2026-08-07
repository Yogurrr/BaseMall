import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css'; // CSS 모듈 import

// 1. Button 컴포넌트의 Props 타입 정의
// ButtonHTMLAttributes<HTMLButtonElement>를 상속받아 기본 버튼 속성을 모두 포함시킵니다.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode; // 버튼 내부에 들어갈 내용 (텍스트, 아이콘 등)
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'; // 버튼 스타일 종류
  size?: 'sm' | 'md' | 'lg'; // 버튼 크기
  isLoading?: boolean; // 로딩 상태 여부
}

export const Button = ({
  children,
  variant = 'primary', // 기본값: primary
  size = 'md',        // 기본값: md
  isLoading = false,
  className = '',     // 외부에서 추가 스타일을 줄 경우
  disabled,
  ...props            // 나머지 모든 기본 버튼 속성 (onClick 등)
}: ButtonProps) => {
  
  // 2. 조건에 따라 적용할 클래스 이름 조합
  const buttonClassNames = [
    styles.button,                  // 공통 스타일
    styles[variant],               // variant 스타일 (e.g., styles.primary)
    styles[size],                  // size 스타일 (e.g., styles.md)
    isLoading ? styles.loading : '', // 로딩 중일 때 스타일
    className                      // 외부 스타일 합치기
  ].join(' ').trim();               // 빈칸으로 구분된 하나의 문자열로 합침

  return (
    <button
      className={buttonClassNames}
      disabled={disabled || isLoading} // 로딩 중이거나 disabled일 때 버튼 비활성화
      {...props} // onClick, type 등을 HTML <button>에 전달
    >
      {isLoading ? (
        // 로딩 상태일 때 보여줄 스피너 (간단한 예시)
        <span className={styles.spinner}></span>
      ) : null}
      {/* 로딩 중일 때도 children을 보여주거나 hidden 처리할 수 있습니다 */}
      <span className={isLoading ? styles.hidden : ''}>{children}</span>
    </button>
  );
};