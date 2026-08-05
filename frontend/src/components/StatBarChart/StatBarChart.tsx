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
import styles from './StatBarChart.module.css';

export interface StatBarChartPoint {
  label: string;
  value: number;
}

interface StatBarChartProps {
  title: string;
  data: StatBarChartPoint[];
  unit?: string;
  highlightLabel?: string;
  xAxisInterval?: number;
}

// 💡 RevenueChart와 같은 시각 스타일의 범용 막대그래프. 통계 페이지의
// 일별/월별 주문 건수, 등급 분포, 카테고리별 판매량이 모두 이 형태를 공유한다.
export const StatBarChart = ({ title, data, unit = '건', highlightLabel, xAxisInterval = 0 }: StatBarChartProps) => (
  <section className={styles.chartCard}>
    <h2>{title}</h2>
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval={xAxisInterval}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--text)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: 'var(--accent-bg)' }}
            formatter={(value) => [`${value}${unit}`, title]}
            contentStyle={{
              background: 'var(--bg)',
              border: '0.05rem solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
            }}
            labelStyle={{ color: 'var(--text-h)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((point) => (
              <Cell
                key={point.label}
                // 💡 highlightLabel이 없으면(회원 등급/카테고리별 판매량처럼 "현재" 개념이 없는 차트)
                // 모든 막대를 진하게 표시한다. highlightLabel이 있을 때만 나머지를 연하게 눌러
                // 대비를 준다 (RevenueChart의 "이번 달 강조" 패턴).
                fill={!highlightLabel || point.label === highlightLabel ? 'var(--accent)' : 'var(--accent-bg)'}
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
