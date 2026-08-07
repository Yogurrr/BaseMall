import { api } from './axiosInstance';
import type { Address } from '../types/address';

export interface SaveAddressParams {
  label?: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  isDefault?: boolean;
}

export const fetchMyAddresses = async (): Promise<Address[]> => {
  const response = await api.get<Address[]>('/addresses/me');
  return response.data;
};

export const saveAddress = async (params: SaveAddressParams): Promise<Address> => {
  const response = await api.post<Address>('/addresses', params);
  return response.data;
};

export const deleteAddress = async (id: number): Promise<Address[]> => {
  const response = await api.delete<Address[]>(`/addresses/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id: number): Promise<Address> => {
  const response = await api.patch<Address>(`/addresses/${id}/default`);
  return response.data;
};
