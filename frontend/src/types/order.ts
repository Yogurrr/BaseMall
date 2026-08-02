export interface OrderItem {
  name: string;
  category?: string;
  emoji: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  buyerName: string;
  buyerEmail: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: string;
  trackingNumber?: string;
}
