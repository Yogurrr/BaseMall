import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '../../api/productApi';
import type { MonthlyRevenuePoint } from '../../types/order';
import styles from './RevenueChart.module.css';

interface RevenueChartProps {
  data: MonthlyRevenuePoint[];
  currentMonth: number;
}

// 💡 Y축 눈금은 좁은 공간에 전체 금액을 다 못 넣으므로 만원 단위로 축약한다.
const formatCompact = (value: number) => {
  if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString('ko-KR')}만원`;
  }
  return formatPrice(value);
};

export const RevenueChart = ({ data, currentMonth }: RevenueChartProps) => {
  const chartData = data.map((point) => ({ ...point, label: `${point.month}월` }));

  return (
    <section className={styles.chartCard}>
      <h2>월별 매출 추이</h2>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fill: 'var(--text)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
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
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {chartData.map((point) => (
                <Cell
                  key={point.month}
                  fill={point.month === currentMonth ? 'var(--accent)' : 'var(--accent-bg)'}
                  stroke="var(--accent-border)"
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
