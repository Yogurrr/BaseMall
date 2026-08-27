import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../../components/Spinner/Spinner';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { RevenueChart } from '../../components/RevenueChart/RevenueChart';
import { RevenueBreakdownChart } from '../../components/RevenueBreakdownChart/RevenueBreakdownChart';
import {
  PeriodFilter,
  type PeriodRange,
} from '../../components/PeriodFilter/PeriodFilter';
import { fetchSales, fetchSalesBreakdown } from '../../api/orderApi';
import { formatPrice } from '../../api/productApi';
import styles from './Admin.module.css';

const toIso = (date: Date) => date.toISOString().slice(0, 10);

const defaultRange = (): PeriodRange => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toIso(first), to: toIso(now) };
};

export const AdminSales = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', 'sales'],
    queryFn: fetchSales,
  });

  const [range, setRange] = useState<PeriodRange>(defaultRange);
  const {
    data: breakdown,
    isLoading: isBreakdownLoading,
    isError: isBreakdownError,
  } = useQuery({
    queryKey: ['orders', 'sales', 'breakdown', range.from, range.to],
    queryFn: () => fetchSalesBreakdown(range.from, range.to),
  });

  const currentMonth = new Date().getMonth() + 1;

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>매출</h1>
      </div>

      {isLoading ? (
        <div className={styles.empty}>
          <Spinner />
        </div>
      ) : isError || !data ? (
        <div className={styles.comingSoon}>
          <StatusMessage icon="⚠️" title="매출 정보를 불러오지 못했습니다">
            잠시 후 다시 시도해주세요.
          </StatusMessage>
        </div>
      ) : (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <span>오늘 매출</span>
              <strong>{formatPrice(data.todayRevenue)}</strong>
            </div>
            <div className={styles.statCard}>
              <span>이번 달 매출</span>
              <strong>{formatPrice(data.monthRevenue)}</strong>
            </div>
            <div className={styles.statCard}>
              <span>올해 매출</span>
              <strong>{formatPrice(data.yearRevenue)}</strong>
            </div>
          </section>

          <RevenueChart data={data.monthlyTrend} currentMonth={currentMonth} />
        </>
      )}

      <div className={styles.panelHeader}>
        <h2>기간별 매출</h2>
      </div>

      <PeriodFilter value={range} onApply={setRange} />

      {isBreakdownLoading ? (
        <div className={styles.empty}>
          <Spinner />
        </div>
      ) : isBreakdownError || !breakdown ? (
        <div className={styles.comingSoon}>
          <StatusMessage icon="⚠️" title="기간별 매출을 불러오지 못했습니다">
            잠시 후 다시 시도해주세요.
          </StatusMessage>
        </div>
      ) : (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <span>선택 기간 매출</span>
              <strong>{formatPrice(breakdown.totalRevenue)}</strong>
            </div>
          </section>

          <div className={styles.breakdownGrid}>
            <RevenueBreakdownChart
              title="구단별 매출"
              data={breakdown.byTeam}
            />
            <RevenueBreakdownChart
              title="품목별 매출"
              data={breakdown.byCategory}
            />
          </div>
        </>
      )}
    </>
  );
};
