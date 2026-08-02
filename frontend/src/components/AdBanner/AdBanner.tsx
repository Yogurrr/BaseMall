import { useEffect, useState } from 'react';
import styles from './AdBanner.module.css';

export interface AdSlide {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  gradient: string;
  image?: string;
}

interface AdBannerProps {
  slides: AdSlide[];
  intervalMs?: number;
}

export const AdBanner = ({ slides, intervalMs = 8000 }: AdBannerProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  const goTo = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  return (
    <section className={styles.banner} aria-label="이벤트 배너">
      <div className={styles.viewport}>
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={styles.slide}
            style={{ background: slide.gradient, opacity: index === activeIndex ? 1 : 0 }}
            aria-hidden={index !== activeIndex}
          >
            {slide.image && !brokenImages.has(index) && (
              <>
                <img
                  src={slide.image}
                  alt=""
                  className={styles.slideImage}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={() => setBrokenImages((prev) => new Set(prev).add(index))}
                />
                <div className={styles.scrim} />
              </>
            )}
            <div className={styles.slideContent}>
              <p className={styles.eyebrow}>{slide.eyebrow}</p>
              <h3 className={styles.title}>{slide.title}</h3>
              <p className={styles.description}>{slide.description}</p>
              <button type="button" className={styles.cta}>
                {slide.ctaLabel}
              </button>
            </div>
          </div>
        ))}

        <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} aria-label="이전 배너" onClick={() => goTo(activeIndex - 1)}>
          ‹
        </button>
        <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} aria-label="다음 배너" onClick={() => goTo(activeIndex + 1)}>
          ›
        </button>
      </div>

      <div className={styles.dots}>
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`}
            aria-label={`${index + 1}번째 배너로 이동`}
            aria-current={index === activeIndex}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
};
