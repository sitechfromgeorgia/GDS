
import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { OrderManager } from './OrderManagement';
import { ProductManager } from './ProductManagement';
import { UserManagement } from './UserManagement';
import { Analytics } from './Analytics';
import { useApp } from '../../App';
import { Card, Badge } from '../ui/Shared';
import { ShoppingBag, DollarSign, Users, Activity, TrendingUp, Package, Database, Zap } from 'lucide-react';
import { OrderStatus } from '../../types';
import { useTranslation } from 'react-i18next';

const DashboardHome = () => {
  const { orders, products, users, isDemo } = useApp();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const totalSales = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
  const activeUsers = users.filter(u => u.role === 'RESTAURANT').length;

  const topSoldProducts = useMemo(() => {
    const salesMap: Record<string, { name: string; quantity: number; unit: string }> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!salesMap[item.productId]) {
          salesMap[item.productId] = { name: item.productName, quantity: 0, unit: item.unit };
        }
        salesMap[item.productId].quantity += item.quantity;
      });
    });

    return Object.values(salesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
        case OrderStatus.PENDING: return t('status.pending');
        case OrderStatus.CONFIRMED: return t('status.confirmed');
        case OrderStatus.OUT_FOR_DELIVERY: return t('status.out_for_delivery');
        case OrderStatus.DELIVERED: return t('status.delivered');
        case OrderStatus.COMPLETED: return t('status.completed');
        default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('admin.overview')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('admin.welcome')}</p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isDemo ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/50' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/50'}`}>
           <div className="relative">
             <Database className={`h-5 w-5 ${isDemo ? 'text-amber-500' : 'text-emerald-500'}`} />
             <div className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse ${isDemo ? 'bg-amber-500' : 'bg-emerald-500'}`} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">System Status</p>
             <p className={`text-xs font-bold ${isDemo ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {isDemo ? 'DEMO MODE (Local DB)' : 'LIVE (Supabase Connected)'}
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title={t('admin.pending_orders')} value={pendingOrders} icon={ShoppingBag} color="bg-amber-500" />
        <StatCard title={t('admin.total_revenue')} value={`$${totalSales.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" />
        <StatCard title={t('admin.active_restaurants')} value={activeUsers} icon={Users} color="bg-blue-500" />
        <StatCard title={t('admin.active_products')} value={products.filter(p => p.isActive).length} icon={Activity} color="bg-indigo-500" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            {i18n.language === 'ka' ? 'ყველაზე გაყიდვადი პროდუქტები' : 'Top Sold Products'}
          </h3>
          <Badge variant="outline">{i18n.language === 'ka' ? 'ბოლო 30 დღე' : 'Last 30 Days'}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topSoldProducts.length > 0 ? topSoldProducts.map((item, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900 transition-all">
              <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">{item.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{item.quantity}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{item.unit}</span>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-6 text-center text-slate-400 dark:text-slate-600 italic text-sm">
              {i18n.language === 'ka' ? 'მონაცემები არ არის' : 'No sales data available'}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 dark:text-slate-100">{t('admin.recent_activity')}</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{order.restaurantName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">ID: {order.id} • {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider
                  ${order.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 
                    order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 border-0 shadow-xl transition-colors">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            {t('admin.quick_actions')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/admin/products')}
              className="bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 p-4 rounded-xl text-left transition-all group border border-white/5 dark:border-slate-900/5"
            >
              <p className="font-bold text-sm group-hover:text-emerald-400 dark:group-hover:text-emerald-600">{t('admin.add_new_product')}</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase font-medium">{t('admin.update_catalog')}</p>
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 p-4 rounded-xl text-left transition-all group border border-white/5 dark:border-slate-900/5"
            >
              <p className="font-bold text-sm group-hover:text-blue-400 dark:group-hover:text-blue-600">{t('admin.manage_drivers')}</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase font-medium">{t('admin.assign_shifts')}</p>
            </button>
            <button className="bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 p-4 rounded-xl text-left transition-all group border border-white/5 dark:border-slate-900/5">
              <p className="font-bold text-sm group-hover:text-amber-400 dark:group-hover:text-amber-600">{t('admin.export_reports')}</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase font-medium">{t('admin.download_csv')}</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/products" element={<ProductManager />} />
      <Route path="/orders" element={<OrderManager />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
