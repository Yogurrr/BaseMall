import { useState } from 'react';
import styles from './MonthRangeFilter.module.css';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateParts {
  y: number;
  m: number;
  d: number;
}

type Preset = '1' | '3' | '6' | '12';

const PRESETS: { key: Preset; label: string; months: number }[] = [
  { key: '1', label: '1개월', months: 1 },
  { key: '3', label: '3개월', months: 3 },
  { key: '6', label: '6개월', months: 6 },
  { key: '12', label: '12개월', months: 12 },
];

const toParts = (date: Date): DateParts => ({
  y: date.getFullYear(),
  m: date.getMonth() + 1,
  d: date.getDate(),
});

const partsToDate = (p: DateParts) => new Date(p.y, p.m - 1, p.d);

const monthsAgo = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};

// 💡 필터의 기본값(최근 1개월)과 동일한 범위. 부모 컴포넌트가 첫 렌더부터
// 필터와 어긋나지 않는 초기 목록을 보여줄 수 있도록 초기 상태 값으로 사용한다.
export const defaultMonthRange = (): DateRange => {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from: monthsAgo(new Date(), 1), to };
};

const today = new Date();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 4 + i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

interface MonthRangeFilterProps {
  label: string;
  notice: string;
  onApply: (range: DateRange) => void;
}

// 💡 주문/배송 조회 페이지의 기간 필터(1/3/6/12개월 프리셋 + 연월일 직접 선택)를
// 다른 내역 패널(적립금 등)에서도 그대로 재사용하기 위해 분리한 컴포넌트.
export const MonthRangeFilter = ({ label, notice, onApply }: MonthRangeFilterProps) => {
  const [activePreset, setActivePreset] = useState<Preset | null>('1');
  const [fromDate, setFromDate] = useState<DateParts>(() => toParts(monthsAgo(new Date(), 1)));
  const [toDate, setToDate] = useState<DateParts>(() => toParts(new Date()));

  const handlePreset = (preset: Preset, months: number) => {
    setActivePreset(preset);
    const now = new Date();
    const from = monthsAgo(now, months);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    setFromDate(toParts(from));
    setToDate(toParts(now));
    onApply({ from, to });
  };

  const handleSearch = () => {
    const from = partsToDate(fromDate);
    const to = partsToDate(toDate);
    to.setHours(23, 59, 59, 999);
    onApply({ from, to });
  };

  return (
    <>
      <div className={styles.filterBox}>
        <div className={styles.filterFields}>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>{label}</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`${styles.presetButton} ${activePreset === preset.key ? styles.presetButtonActive : ''}`}
                onClick={() => handlePreset(preset.key, preset.months)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={styles.filterRow}>
            <span className={styles.filterLabel} />
            <div className={styles.dateRange}>
              <DateSelect
                parts={fromDate}
                onChange={(next) => {
                  setActivePreset(null);
                  setFromDate(next);
                }}
              />
              <span>~</span>
              <DateSelect
                parts={toDate}
                onChange={(next) => {
                  setActivePreset(null);
                  setToDate(next);
                }}
              />
            </div>
          </div>
        </div>

        <button type="button" className={styles.searchButton} onClick={handleSearch}>
          조회
        </button>
      </div>

      <ul className={styles.notices}>
        <li>{notice}</li>
      </ul>
    </>
  );
};

interface DateSelectProps {
  parts: DateParts;
  onChange: (parts: DateParts) => void;
}

const DateSelect = ({ parts, onChange }: DateSelectProps) => (
  <>
    <select value={parts.y} onChange={(e) => onChange({ ...parts, y: Number(e.target.value) })}>
      {YEAR_OPTIONS.map((y) => (
        <option key={y} value={y}>
          {y}년
        </option>
      ))}
    </select>
    <select value={parts.m} onChange={(e) => onChange({ ...parts, m: Number(e.target.value) })}>
      {MONTH_OPTIONS.map((m) => (
        <option key={m} value={m}>
          {m}월
        </option>
      ))}
    </select>
    <select value={parts.d} onChange={(e) => onChange({ ...parts, d: Number(e.target.value) })}>
      {DAY_OPTIONS.map((d) => (
        <option key={d} value={d}>
          {d}일
        </option>
      ))}
    </select>
  </>
);
