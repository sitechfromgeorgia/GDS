import { useMemo } from 'react';
import { Order, OrderStatus } from '../types';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface FilterOptions {
  statusFilter?: OrderStatus | 'all';
  searchQuery?: string;
  dateRange?: DateRange;
  restaurantId?: string;
}

/**
 * Custom hook for filtering orders with memoization
 * Supports filtering by status, search query, date range, and restaurant
 */
export function useFilteredOrders(orders: Order[], options: FilterOptions = {}) {
  const {
    statusFilter = 'all',
    searchQuery = '',
    dateRange,
    restaurantId
  } = options;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by status
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Filter by restaurant
      if (restaurantId && order.restaurantId !== restaurantId) {
        return false;
      }

      // Filter by search query (restaurant name or order ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRestaurant = order.restaurantName?.toLowerCase().includes(query);
        const matchesId = order.id.toLowerCase().includes(query);
        if (!matchesRestaurant && !matchesId) {
          return false;
        }
      }

      // Filter by date range
      if (dateRange?.from || dateRange?.to) {
        const orderDate = new Date(order.createdAt);

        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (orderDate < fromDate) return false;
        }

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (orderDate > toDate) return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery, dateRange, restaurantId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = filteredOrders.filter(o => o.status === OrderStatus.PENDING).length;
    const confirmed = filteredOrders.filter(o => o.status === OrderStatus.CONFIRMED).length;
    const outForDelivery = filteredOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY).length;
    const delivered = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const completed = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).length;

    const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalProfit = filteredOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    return {
      total: filteredOrders.length,
      pending,
      confirmed,
      outForDelivery,
      delivered,
      completed,
      totalRevenue,
      totalProfit,
      avgOrderValue
    };
  }, [filteredOrders]);

  return {
    filteredOrders,
    stats
  };
}

export default useFilteredOrders;
