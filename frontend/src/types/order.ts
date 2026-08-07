export interface OrderItem {
  name: string;
  category?: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  size?: string;
  markingName?: string;
}

export interface Order {
  id: number;
  buyerName: string;
  buyerEmail: string;
  status: string;
  totalPrice: number;
  discountAmount: number;
  createdAt: string;
  items: OrderItem[];
  trackingNumber?: string;
  recipientName?: string;
  recipientPhone?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  deliveryRequest?: string;
  entryMethod?: string;
  entryNote?: string;
  paymentMethod?: string;
  pointsUsed?: number;
  pointsEarned?: number;
}

export interface MonthlyRevenuePoint {
  month: number;
  revenue: number;
}

export interface SalesSummary {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  monthlyTrend: MonthlyRevenuePoint[];
}

export interface RevenueByGroup {
  name: string;
  revenue: number;
}

export interface SalesBreakdown {
  totalRevenue: number;
  byTeam: RevenueByGroup[];
  byCategory: RevenueByGroup[];
}

export interface DailyOrderCountPoint {
  date: string;
  count: number;
}

export interface MonthlyOrderCountPoint {
  month: number;
  count: number;
}

export interface OrderCountStats {
  daily: DailyOrderCountPoint[];
  monthly: MonthlyOrderCountPoint[];
}
