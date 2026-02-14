import http from '../../../services/http';

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'InPreparation'
  | 'ReadyForDelivery'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  companyId: string;
  deliveryDate: string;
  deliveryAddress: string;
  vegCount: number;
  nonVegCount: number;
  riceType: string;
  status: OrderStatus;
  totalAmount: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

export const ordersApi = {
  getAll: (deliveryDate?: string) => {
    const params = deliveryDate ? { deliveryDate } : undefined;
    return http.get<Order[]>('/orders', { params });
  },
  getById: (id: string) => http.get<Order>(`/orders/${id}`),
  create: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => 
    http.post<Order>('/orders', order),
  update: (id: string, order: Order) => 
    http.put(`/orders/${id}`, order),
  delete: (id: string) => http.delete(`/orders/${id}`),
};
