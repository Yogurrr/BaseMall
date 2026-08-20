export interface DateRange {
  from: Date;
  to: Date;
}

export const monthsAgo = (date: Date, months: number) => {
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
