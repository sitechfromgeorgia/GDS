export const DEMO_SAMPLE_DATA = {
  admin: {
    totalOrders: 150,
    totalRevenue: 25000,
    activeRestaurants: 25,
    activeDrivers: 12,
    recentOrders: [],
  },
  restaurant: {
    pendingOrders: 5,
    completedOrders: 45,
    menuItems: 20,
    recentOrders: [],
  },
  driver: {
    available: true,
    currentDeliveries: 2,
    completedToday: 8,
    earnings: 120,
  },
  demo: {
    totalOrders: 150,
    totalRevenue: 25000,
    activeRestaurants: 25,
    activeDrivers: 12,
    recentOrders: [],
  },
}

export const DEMO_TOUR_STEPS = {
  admin: [
    {
      id: 1,
      title: 'Dashboard Overview',
      description: 'Get familiar with the admin dashboard',
      target: '#admin-dashboard',
      autoAdvance: 3000,
      completed: false,
    },
    {
      id: 2,
      title: 'User Management',
      description: 'Learn to manage users and roles',
      target: '#user-management',
      autoAdvance: 4000,
      completed: false,
    },
  ],
  restaurant: [
    {
      id: 1,
      title: 'Menu Setup',
      description: 'Configure your restaurant menu',
      target: '#menu-setup',
      autoAdvance: 3000,
      completed: false,
    },
    {
      id: 2,
      title: 'Order Management',
      description: 'Handle incoming orders',
      target: '#order-management',
      autoAdvance: 4000,
      completed: false,
    },
  ],
  driver: [
    {
      id: 1,
      title: 'Delivery Interface',
      description: 'Navigate the delivery app',
      target: '#delivery-interface',
      autoAdvance: 3000,
      completed: false,
    },
    {
      id: 2,
      title: 'Route Planning',
      description: 'Plan efficient delivery routes',
      target: '#route-planning',
      autoAdvance: 4000,
      completed: false,
    },
  ],
  demo: [
    {
      id: 1,
      title: 'System Overview',
      description: 'Explore the full system capabilities',
      target: '#demo-overview',
      autoAdvance: 3000,
      completed: false,
    },
    {
      id: 2,
      title: 'Role Switching',
      description: 'Switch between different user roles',
      target: '#role-switching',
      autoAdvance: 4000,
      completed: false,
    },
  ],
}

export const DEMO_ANALYTICS_DATA = {
  admin: {
    total_orders: 150,
    total_revenue: 25000,
    active_restaurants: 25,
    active_drivers: 12,
    average_delivery_time: 25,
    customer_satisfaction: 4.5,
    monthly_growth: 15,
    top_products: [
      { name: 'Product A', sales: 45 },
      { name: 'Product B', sales: 38 },
      { name: 'Product C', sales: 32 },
    ],
    revenue_by_month: [
      { month: 'Jan', revenue: 5000 },
      { month: 'Feb', revenue: 6200 },
      { month: 'Mar', revenue: 5800 },
    ],
    order_status_distribution: [
      { status: 'pending', count: 25 },
      { status: 'in_transit', count: 12 },
      { status: 'delivered', count: 113 },
    ],
  },
  restaurant: {
    pending_orders: 25,
    completed_orders: 125,
    total_revenue: 18000,
    average_order_value: 144,
    popular_items: [
      { name: 'Pizza', sales: 45 },
      { name: 'Burger', sales: 38 },
      { name: 'Salad', sales: 32 },
    ],
    revenue_by_day: [
      { date: 'Mon', revenue: 800 },
      { date: 'Tue', revenue: 950 },
      { date: 'Wed', revenue: 1200 },
    ],
  },
  driver: {
    total_deliveries: 85,
    completed_today: 8,
    total_earnings: 850,
    average_delivery_time: 25,
    customer_rating: 4.8,
    delivery_by_hour: [
      { hour: '10:00', deliveries: 2 },
      { hour: '12:00', deliveries: 5 },
      { hour: '14:00', deliveries: 3 },
    ],
  },
  demo: {
    total_orders: 150,
    total_revenue: 25000,
    active_restaurants: 25,
    active_drivers: 12,
    average_delivery_time: 25,
    customer_satisfaction: 4.5,
    monthly_growth: 15,
    top_products: [
      { name: 'Product A', sales: 45 },
      { name: 'Product B', sales: 38 },
      { name: 'Product C', sales: 32 },
    ],
    revenue_by_month: [
      { month: 'Jan', revenue: 5000 },
      { month: 'Feb', revenue: 6200 },
      { month: 'Mar', revenue: 5800 },
    ],
    order_status_distribution: [
      { status: 'pending', count: 25 },
      { status: 'in_transit', count: 12 },
      { status: 'delivered', count: 113 },
    ],
  },
}
