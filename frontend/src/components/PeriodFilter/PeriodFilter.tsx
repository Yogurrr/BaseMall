import { useState } from 'react';
import styles from './PeriodFilter.module.css';

export interface PeriodRange {
  from: string;
  to: string;
}

interface PeriodFilterProps {
  value: PeriodRange;
  onApply: (range: PeriodRange) => void;
}

type PresetKey = 'today' | 'week' | 'month' | 'year';

const toIso = (date: Date) => date.toISOString().slice(0, 10);

const PRESETS: { key: PresetKey; label: string; range: () => PeriodRange }[] = [
  {
    key: 'today',
    label: '오늘',
    range: () => {
      const today = toIso(new Date());
      return { from: today, to: today };
    },
  },
  {
    key: 'week',
    label: '이번 주',
    range: () => {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      return { from: toIso(monday), to: toIso(now) };
    },
  },
  {
    key: 'month',
    label: '이번 달',
    range: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toIso(first), to: toIso(now) };
    },
  },
  {
    key: 'year',
    label: '올해',
    range: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), 0, 1);
      return { from: toIso(first), to: toIso(now) };
    },
  },
];

export const PeriodFilter = ({ value, onApply }: PeriodFilterProps) => {
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const [activePreset, setActivePreset] = useState<PresetKey | null>('month');

  const handlePreset = (preset: PresetKey, range: () => PeriodRange) => {
    const next = range();
    setActivePreset(preset);
    setFrom(next.from);
    setTo(next.to);
    onApply(next);
  };

  const handleSearch = () => {
    if (!from || !to || from > to) return;
    setActivePreset(null);
    onApply({ from, to });
  };

  return (
    <div className={styles.filterBox}>
      <div className={styles.presetRow}>
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`${styles.presetButton} ${activePreset === preset.key ? styles.presetButtonActive : ''}`}
            onClick={() => handlePreset(preset.key, preset.range)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className={styles.dateRow}>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => {
            setActivePreset(null);
            setFrom(e.target.value);
          }}
        />
        <span>~</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => {
            setActivePreset(null);
            setTo(e.target.value);
          }}
        />
        <button
          type="button"
          className={styles.searchButton}
          onClick={handleSearch}
        >
          조회
        </button>
      </div>
    </div>
  );
};
