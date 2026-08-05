import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice } from '../../api/productApi';
import type { RevenueByGroup } from '../../types/order';
import styles from './RevenueBreakdownChart.module.css';

interface RevenueBreakdownChartProps {
  title: string;
  data: RevenueByGroup[];
}

const formatCompact = (value: number) => {
  if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString('ko-KR')}만원`;
  }
  return formatPrice(value);
};

export const RevenueBreakdownChart = ({ title, data }: RevenueBreakdownChartProps) => {
  const chartHeight = Math.max(data.length * 36, 120);

  return (
    <section className={styles.chartCard}>
      <h2>{title}</h2>
      {data.length === 0 ? (
        <p className={styles.empty}>선택한 기간에 매출 데이터가 없습니다.</p>
      ) : (
        <div className={styles.chart} style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatCompact}
                tick={{ fill: 'var(--text)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                tick={{ fill: 'var(--text)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--accent-bg)' }}
                formatter={(value) => [formatPrice(Number(value)), '매출']}
                contentStyle={{
                  background: 'var(--bg)',
                  border: '0.05rem solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                }}
                labelStyle={{ color: 'var(--text-h)' }}
              />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
