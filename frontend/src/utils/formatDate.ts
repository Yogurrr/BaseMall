export const formatDate = (date: string | number | Date) =>
  new Date(date).toLocaleDateString('ko-KR');

export const formatDateTime = (date: string | number | Date) =>
  new Date(date).toLocaleString('ko-KR');
