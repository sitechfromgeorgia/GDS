
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
  password?: string; // Added password field
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
  unit: string; // kg, piece, pack
  image: string;
  isActive: boolean;
  isPromo?: boolean; // Added promo flag
  price?: number; // Promo/Special price visible to all
  viewCount?: number; // Added for analytics
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice?: number; // Set by admin
  sellPrice?: number; // Set by admin
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  driverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string; // ISO date
  notes?: string;
  totalCost?: number; // Calculated sum of sellPrice * quantity
  totalProfit?: number; // Calculated sum of (sellPrice - costPrice) * quantity
}

export interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalProfit: number;
  topProducts: { name: string; value: number }[];
  salesTrend: { date: string; amount: number }[];
}
