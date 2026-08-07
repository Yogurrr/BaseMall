export interface Address {
  id: number;
  label?: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  isDefault: boolean;
}
