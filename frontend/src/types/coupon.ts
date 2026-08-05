export interface Coupon {
  id: number;
  name: string;
  grade: string;
  discountPercent: number;
  issuedAt: string;
  usedAt?: string | null;
}
