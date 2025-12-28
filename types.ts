
export enum UserRole {
  ADMIN = 'ADMIN',
  RESTAURANT = 'RESTAURANT',
  DRIVER = 'DRIVER',
  DEMO = 'DEMO'
}

export enum OrderStatus {
  PENDING = 'Pending Confirmation',
  CONFIRMED = 'Confirmed', // Ready for purchasing
  OUT_FOR_DELIVERY = 'Out for Delivery', // Assigned to driver
  DELIVERED = 'Delivered', // Driver dropped off
  COMPLETED = 'Completed' // Restaurant received
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  isActive?: boolean; 
  phone?: string;
  locationLink?: string; 
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  image: string;
  isActive: boolean;
  isPromo?: boolean;
  price?: number;
  viewCount?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice?: number;
  sellPrice?: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  driverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  notes?: string;
  totalCost?: number;
  totalProfit?: number;
}

export interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalProfit: number;
  topProducts: { name: string; value: number }[];
  salesTrend: { date: string; amount: number }[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
