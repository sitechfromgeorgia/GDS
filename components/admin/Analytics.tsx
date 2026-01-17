
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../App';
import { Card, Badge, Button } from '../ui/Shared';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Sector, LineChart, Line
} from 'recharts';
import {
  BarChart3, TrendingUp, ShoppingBag,
  DollarSign, Target, PieChart as PieIcon,
  Store, Percent, Download, Calendar, Package,
  Users, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OrderStatus } from '../../types';

type TimePeriod = 'today' | 'week' | 'month' | 'year';

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-black text-xs uppercase dark:fill-slate-100">
        {payload.name}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#334155" className="font-bold text-[10px] dark:fill-slate-300">{`₾${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={15} textAnchor={textAnchor} fill="#94a3b8" className="text-[9px] dark:fill-slate-400">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export const Analytics = () => {
  const { t, i18n } = useTranslation();
  const { orders, products, users, theme } = useApp();
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

  const isGeo = i18n.language === 'ka';
  const isDark = theme === 'dark';

  // Filter orders by time period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (timePeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return orders.filter(o => new Date(o.createdAt) >= startDate);
  }, [orders, timePeriod]);

  // Calculate metrics based on filtered orders
  const metrics = useMemo(() => {
    const totalSales = filteredOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalProfit = filteredOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0);
    const avgOrder = filteredOrders.length ? totalSales / filteredOrders.length : 0;
    const activeRest = users.filter(u => u.role === 'RESTAURANT').length;
    const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).length;

    // Calculate previous period for comparison
    const now = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    switch (timePeriod) {
      case 'today':
        prevStartDate.setDate(now.getDate() - 1);
        prevStartDate.setHours(0, 0, 0, 0);
        prevEndDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        prevStartDate.setDate(now.getDate() - 14);
        prevEndDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        prevStartDate.setDate(now.getDate() - 60);
        prevEndDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        prevStartDate.setFullYear(now.getFullYear() - 2);
        prevEndDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const prevOrders = orders.filter(o => {
      const date = new Date(o.createdAt);
      return date >= prevStartDate && date < prevEndDate;
    });

    const prevSales = prevOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const prevProfit = prevOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0);
    const prevMargin = prevSales > 0 ? (prevProfit / prevSales) * 100 : 0;
    const prevAvgOrder = prevOrders.length ? prevSales / prevOrders.length : 0;

    const salesTrend = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;
    const profitTrend = prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0;
    const marginTrend = margin - prevMargin;
    const avgOrderTrend = prevAvgOrder > 0 ? ((avgOrder - prevAvgOrder) / prevAvgOrder) * 100 : 0;

    return {
      totalSales, totalProfit, avgOrder, activeRest, margin,
      totalOrders, completedOrders,
      salesTrend, profitTrend, marginTrend: margin - prevMargin, avgOrderTrend
    };
  }, [filteredOrders, users, orders, timePeriod]);

  // Sales trend data based on period
  const salesTrend = useMemo(() => {
    if (timePeriod === 'today') {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours.map(hour => {
        const hourOrders = filteredOrders.filter(o => {
          const orderHour = new Date(o.createdAt).getHours();
          return orderHour === hour;
        });
        return {
          name: `${hour}:00`,
          revenue: hourOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0),
          profit: hourOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0),
          orders: hourOrders.length
        };
      });
    } else if (timePeriod === 'week') {
      const days = isGeo ? ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        const dayOrders = filteredOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        return {
          name: days[date.getDay()],
          revenue: dayOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0),
          profit: dayOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0),
          orders: dayOrders.length
        };
      });
    } else if (timePeriod === 'month') {
      const now = new Date();
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (29 - i));
        const dayOrders = filteredOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        return {
          name: `${date.getDate()}/${date.getMonth() + 1}`,
          revenue: dayOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0),
          profit: dayOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0),
          orders: dayOrders.length
        };
      });
    } else {
      const months = isGeo
        ? ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(now.getMonth() - (11 - i));
        const monthOrders = filteredOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
        });
        return {
          name: months[date.getMonth()],
          revenue: monthOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0),
          profit: monthOrders.reduce((acc, o) => acc + (o.totalProfit || 0), 0),
          orders: monthOrders.length
        };
      });
    }
  }, [filteredOrders, timePeriod, isGeo]);

  // Top products by sales
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += (item.sellPrice || 0) * item.quantity;
      });
    });
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Top restaurants by orders
  const topRestaurants = useMemo(() => {
    const restaurantStats: Record<string, { name: string; orders: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      if (!restaurantStats[o.restaurantId]) {
        restaurantStats[o.restaurantId] = { name: o.restaurantName, orders: 0, revenue: 0 };
      }
      restaurantStats[o.restaurantId].orders += 1;
      restaurantStats[o.restaurantId].revenue += o.totalCost || 0;
    });
    return Object.values(restaurantStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    const statuses = Object.values(OrderStatus);
    return statuses.map(status => ({
      name: t(`status.${status === OrderStatus.PENDING ? 'pending' :
        status === OrderStatus.CONFIRMED ? 'confirmed' :
        status === OrderStatus.OUT_FOR_DELIVERY ? 'out_for_delivery' :
        status === OrderStatus.DELIVERED ? 'delivered' : 'completed'}`),
      value: filteredOrders.filter(o => o.status === status).length
    })).filter(s => s.value > 0);
  }, [filteredOrders, t]);

  const categoryDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(i => {
        const prod = products.find(p => p.id === i.productId);
        const cat = prod?.category || 'Other';
        dist[cat] = (dist[cat] || 0) + ((i.sellPrice || 0) * i.quantity);
      });
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [filteredOrders, products]);

  // Export functionality
  const handleExport = useCallback(() => {
    const csvData = [
      ['GDS Analytics Report'],
      [`Period: ${t(`analytics.period_${timePeriod}`)}`],
      [`Generated: ${new Date().toLocaleString(isGeo ? 'ka-GE' : 'en-US')}`],
      [],
      ['Summary Metrics'],
      ['Total Revenue', `₾${metrics.totalSales.toLocaleString()}`],
      ['Net Profit', `₾${metrics.totalProfit.toLocaleString()}`],
      ['Average Margin', `${metrics.margin.toFixed(1)}%`],
      ['Average Order Value', `₾${metrics.avgOrder.toFixed(0)}`],
      ['Total Orders', metrics.totalOrders],
      ['Completed Orders', metrics.completedOrders],
      ['Active Partners', metrics.activeRest],
      [],
      ['Top Products'],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...topProducts.map(p => [p.name, p.quantity, `₾${p.revenue.toFixed(2)}`]),
      [],
      ['Top Restaurants'],
      ['Restaurant Name', 'Orders', 'Revenue'],
      ...topRestaurants.map(r => [r.name, r.orders, `₾${r.revenue.toFixed(2)}`]),
      [],
      ['Sales Trend'],
      ['Period', 'Revenue', 'Profit', 'Orders'],
      ...salesTrend.map(s => [s.name, `₾${s.revenue}`, `₾${s.profit}`, s.orders]),
      [],
      ['Category Distribution'],
      ['Category', 'Revenue'],
      ...categoryDistribution.map(c => [c.name, `₾${c.value}`])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GDS_Analytics_${timePeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [metrics, topProducts, topRestaurants, salesTrend, categoryDistribution, timePeriod, t, isGeo]);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
  const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#22c55e'];

  const periodButtons: { key: TimePeriod; label: string }[] = [
    { key: 'today', label: t('analytics.period_today') },
    { key: 'week', label: t('analytics.period_week') },
    { key: 'month', label: t('analytics.period_month') },
    { key: 'year', label: t('analytics.period_year') }
  ];

  const formatTrend = (value: number) => {
    const formatted = value.toFixed(1);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Period Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            {t('admin.bi_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t('admin.realtime_desc')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Time Period Buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {periodButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimePeriod(key)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  timePeriod === key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" className="h-11" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('admin.export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('admin.total_revenue'), val: `₾${metrics.totalSales.toLocaleString()}`, icon: DollarSign, trend: metrics.salesTrend, color: '#3b82f6' },
          { label: t('admin.net_profit'), val: `₾${metrics.totalProfit.toLocaleString()}`, icon: Target, trend: metrics.profitTrend, color: '#10b981' },
          { label: t('admin.avg_margin'), val: `${metrics.margin.toFixed(1)}%`, icon: Percent, trend: metrics.marginTrend, color: '#ec4899' },
          { label: t('admin.avg_order'), val: `₾${metrics.avgOrder.toFixed(0)}`, icon: ShoppingBag, trend: metrics.avgOrderTrend, color: '#6366f1' },
          { label: t('admin.partners'), val: metrics.activeRest, icon: Store, trend: 0, color: '#f59e0b' },
        ].map((m, i) => (
          <Card key={i} className="p-5 group hover:scale-[1.02] transition-transform border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</p>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{m.val}</h4>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800" style={{ color: m.color }}>
                <m.icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-3 text-[10px] font-bold flex items-center gap-1 ${m.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {m.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {formatTrend(m.trend)} {t('analytics.vs_previous')}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" /> {t('admin.sales_trends')}
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t('analytics.revenue')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t('analytics.profit')}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`₾${value.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 h-[400px]">
          <h3 className="text-lg font-black dark:text-slate-100 mb-6 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-indigo-500" /> {t('admin.categories')}
          </h3>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  data={categoryDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                >
                  {categoryDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              {t('admin.no_sales_data')}
            </div>
          )}
        </Card>
      </div>

      {/* Second Row - Top Products & Restaurants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6">
          <h3 className="text-lg font-black dark:text-slate-100 mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" /> {t('analytics.top_products')}
          </h3>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{product.quantity} {t('analytics.units_sold')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-slate-100">₾{product.revenue.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              {t('admin.no_sales_data')}
            </div>
          )}
        </Card>

        {/* Top Restaurants */}
        <Card className="p-6">
          <h3 className="text-lg font-black dark:text-slate-100 mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" /> {t('analytics.top_restaurants')}
          </h3>
          {topRestaurants.length > 0 ? (
            <div className="space-y-4">
              {topRestaurants.map((restaurant, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{restaurant.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{restaurant.orders} {t('analytics.orders')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-slate-100">₾{restaurant.revenue.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              {t('admin.no_sales_data')}
            </div>
          )}
        </Card>
      </div>

      {/* Third Row - Orders Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-black dark:text-slate-100 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" /> {t('analytics.order_status')}
          </h3>
          {orderStatusData.length > 0 ? (
            <div className="space-y-3">
              {orderStatusData.map((status, idx) => {
                const percentage = metrics.totalOrders > 0 ? (status.value / metrics.totalOrders) * 100 : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{status.name}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{status.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: STATUS_COLORS[idx % STATUS_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              {t('admin.no_sales_data')}
            </div>
          )}
        </Card>

        {/* Orders Trend */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-black dark:text-slate-100 mb-6 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-500" /> {t('analytics.orders_trend')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
