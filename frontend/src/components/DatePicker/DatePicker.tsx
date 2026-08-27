import { useEffect, useRef, useState } from 'react';
import { todayIso } from '../../utils/todayIso';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  placeholder?: string;
  id?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

const toIso = (y: number, mIdx: number, d: number) =>
  `${y}-${pad(mIdx + 1)}-${pad(d)}`;

const parseIso = (iso: string | undefined | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, mIdx: m - 1, d };
};

const today = new Date();

interface Cell {
  y: number;
  mIdx: number;
  d: number;
  inCurrentMonth: boolean;
}

const buildGrid = (viewYear: number, viewMonthIdx: number): Cell[] => {
  const firstWeekday = new Date(viewYear, viewMonthIdx, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonthIdx, 0).getDate();

  const cells: Cell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const prevMonthIdx = viewMonthIdx === 0 ? 11 : viewMonthIdx - 1;
    const prevYear = viewMonthIdx === 0 ? viewYear - 1 : viewYear;
    cells.push({
      y: prevYear,
      mIdx: prevMonthIdx,
      d: daysInPrevMonth - i,
      inCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y: viewYear, mIdx: viewMonthIdx, d, inCurrentMonth: true });
  }

  const nextMonthIdx = viewMonthIdx === 11 ? 0 : viewMonthIdx + 1;
  const nextYear = viewMonthIdx === 11 ? viewYear + 1 : viewYear;
  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({
      y: nextYear,
      mIdx: nextMonthIdx,
      d: nextDay,
      inCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
};

const formatDisplay = (iso: string) => {
  const parsed = parseIso(iso);
  if (!parsed) return null;
  return `${parsed.y}년 ${parsed.mIdx + 1}월 ${parsed.d}일`;
};

export const DatePicker = ({
  value,
  onChange,
  max,
  min,
  placeholder = '날짜 선택',
  id,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    () => parseIso(value)?.y ?? today.getFullYear(),
  );
  const [viewMonthIdx, setViewMonthIdx] = useState(
    () => parseIso(value)?.mIdx ?? today.getMonth(),
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openPicker = () => {
    const parsed = parseIso(value);
    setViewYear(parsed?.y ?? today.getFullYear());
    setViewMonthIdx(parsed?.mIdx ?? today.getMonth());
    setIsOpen(true);
  };

  const changeMonth = (delta: number) => {
    let nextMonthIdx = viewMonthIdx + delta;
    let nextYear = viewYear;
    if (nextMonthIdx < 0) {
      nextMonthIdx = 11;
      nextYear -= 1;
    } else if (nextMonthIdx > 11) {
      nextMonthIdx = 0;
      nextYear += 1;
    }
    setViewYear(nextYear);
    setViewMonthIdx(nextMonthIdx);
  };

  const selectDate = (cell: Cell) => {
    onChange(toIso(cell.y, cell.mIdx, cell.d));
    setIsOpen(false);
  };

  const maxYear = parseIso(max)?.y ?? today.getFullYear();
  const minYear = parseIso(min)?.y ?? today.getFullYear() - 100;
  const yearOptions = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i,
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => i);

  const cells = buildGrid(viewYear, viewMonthIdx);
  const display = formatDisplay(value);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        id={id}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
      >
        <span className={display ? undefined : styles.placeholder}>
          {display ?? placeholder}
        </span>
        <span className={styles.icon}>📅</span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => changeMonth(-1)}
              aria-label="이전 달"
            >
              ‹
            </button>
            <div className={styles.selects}>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
              <select
                value={viewMonthIdx}
                onChange={(e) => setViewMonthIdx(Number(e.target.value))}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m + 1}월
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => changeMonth(1)}
              aria-label="다음 달"
            >
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((w, i) => (
              <span
                key={w}
                className={
                  i === 0
                    ? styles.weekdaySun
                    : i === 6
                      ? styles.weekdaySat
                      : undefined
                }
              >
                {w}
              </span>
            ))}
          </div>

          <div className={styles.grid}>
            {cells.map((cell, index) => {
              const iso = toIso(cell.y, cell.mIdx, cell.d);
              const isSelected = iso === value;
              const isToday = iso === todayIso;
              const isDisabled = (!!max && iso > max) || (!!min && iso < min);
              const weekdayIdx = index % 7;

              const classNames = [styles.day];
              if (!cell.inCurrentMonth) classNames.push(styles.dayOutside);
              if (weekdayIdx === 0) classNames.push(styles.daySun);
              if (weekdayIdx === 6) classNames.push(styles.daySat);
              if (isToday) classNames.push(styles.dayToday);
              if (isSelected) classNames.push(styles.daySelected);

              return (
                <button
                  key={iso}
                  type="button"
                  className={classNames.join(' ')}
                  disabled={isDisabled}
                  onClick={() => selectDate(cell)}
                >
                  {cell.d}
                </button>
              );
            })}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.footerButton}
              onClick={() => onChange('')}
            >
              지우기
            </button>
            <button
              type="button"
              className={styles.footerButton}
              onClick={() => {
                setViewYear(today.getFullYear());
                setViewMonthIdx(today.getMonth());
                onChange(todayIso);
                setIsOpen(false);
              }}
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
