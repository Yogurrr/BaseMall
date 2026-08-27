import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../../components/Spinner/Spinner';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { StatBarChart } from '../../components/StatBarChart/StatBarChart';
import { ProductThumb } from '../../components/ProductThumb/ProductThumb';
import { fetchOrderCountStats } from '../../api/orderApi';
import { fetchMemberStats } from '../../api/userApi';
import { fetchProductStats } from '../../api/productApi';
import styles from './Admin.module.css';

const formatShortDate = (iso: string) => {
  const [, month, day] = iso.split('-');
  return `${month}.${day}`;
};

export const AdminStats = () => {
  const orderStats = useQuery({
    queryKey: ['stats', 'orders'],
    queryFn: fetchOrderCountStats,
  });
  const memberStats = useQuery({
    queryKey: ['stats', 'members'],
    queryFn: fetchMemberStats,
  });
  const productStats = useQuery({
    queryKey: ['stats', 'products'],
    queryFn: fetchProductStats,
  });

  const today = new Date();
  // 💡 toISOString()은 UTC 기준이라 로컬 타임존이 KST가 아니면 날짜가 하루 밀릴 수 있다.
  // 백엔드가 Asia/Seoul 기준으로 날짜를 나누므로, 여기서도 로컬 Date 필드를 그대로 쓴다.
  const todayLabel = `${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const currentMonthLabel = `${today.getMonth() + 1}월`;

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>통계</h1>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>주문 통계</h2>
        {orderStats.isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : orderStats.isError || !orderStats.data ? (
          <div className={styles.comingSoon}>
            <StatusMessage icon="⚠️" title="주문 통계를 불러오지 못했습니다">
              잠시 후 다시 시도해주세요.
            </StatusMessage>
          </div>
        ) : (
          <div className={styles.breakdownGrid}>
            <StatBarChart
              title="일별 주문 건수 (최근 30일)"
              data={orderStats.data.daily.map((point) => ({
                label: formatShortDate(point.date),
                value: point.count,
              }))}
              highlightLabel={todayLabel}
              xAxisInterval={2}
            />
            <StatBarChart
              title="월별 주문 건수"
              data={orderStats.data.monthly.map((point) => ({
                label: `${point.month}월`,
                value: point.count,
              }))}
              highlightLabel={currentMonthLabel}
            />
          </div>
        )}
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>회원 통계</h2>
        {memberStats.isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : memberStats.isError || !memberStats.data ? (
          <div className={styles.comingSoon}>
            <StatusMessage icon="⚠️" title="회원 통계를 불러오지 못했습니다">
              잠시 후 다시 시도해주세요.
            </StatusMessage>
          </div>
        ) : (
          <>
            <section className={styles.stats}>
              <div className={styles.statCard}>
                <span>오늘 신규 가입</span>
                <strong>{memberStats.data.todaySignups}명</strong>
              </div>
              <div className={styles.statCard}>
                <span>이번 달 신규 가입</span>
                <strong>{memberStats.data.monthSignups}명</strong>
              </div>
              <div className={styles.statCard}>
                <span>전체 회원</span>
                <strong>{memberStats.data.totalMembers}명</strong>
              </div>
              <div className={styles.statCard}>
                <span>이번 달 탈퇴</span>
                <strong>{memberStats.data.monthWithdrawn}명</strong>
              </div>
              <div className={styles.statCard}>
                <span>전체 탈퇴 회원</span>
                <strong>{memberStats.data.totalWithdrawn}명</strong>
              </div>
            </section>

            <StatBarChart
              title="회원 등급 분포"
              unit="명"
              data={memberStats.data.gradeDistribution.map((row) => ({
                label: row.grade,
                value: row.count,
              }))}
            />
          </>
        )}
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>상품 통계</h2>
        {productStats.isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : productStats.isError || !productStats.data ? (
          <div className={styles.comingSoon}>
            <StatusMessage icon="⚠️" title="상품 통계를 불러오지 못했습니다">
              잠시 후 다시 시도해주세요.
            </StatusMessage>
          </div>
        ) : (
          <>
            <section className={styles.stats}>
              <div className={styles.statCard}>
                <span>품절 상품 수</span>
                <strong>{productStats.data.outOfStockCount}개</strong>
              </div>
            </section>

            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>상품</th>
                    <th>카테고리</th>
                    <th>판매량</th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>
                        아직 판매 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    productStats.data.topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>
                          <ProductThumb
                            imageUrl={product.imageUrl}
                            alt={product.name}
                            size="sm"
                          />{' '}
                          {product.name}
                        </td>
                        <td>{product.category}</td>
                        <td>{product.soldCount}개</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <StatBarChart
              title="카테고리별 판매량"
              unit="개"
              data={productStats.data.categorySales.map((row) => ({
                label: row.category,
                value: row.soldCount,
              }))}
            />
          </>
        )}
      </div>
    </>
  );
};
