
import React, { useState, useMemo } from 'react';
import { useApp } from '../../App';
// Added Button to imports from Shared components
import { Card, Badge, Button } from '../ui/Shared';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, PieChart, Pie, Sector, LineChart, Line, Legend
} from 'recharts';
import { 
  BarChart3, TrendingUp, ShoppingBag, 
  DollarSign, Target, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, 
  Store, Package,Percent, Calendar, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Custom render for Pie Chart active shape
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
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#334155" className="font-bold text-[10px] dark:fill-slate-300">{`$${value}`}</text>
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

  const isGeo = i18n.language === 'ka';
  const isDark = theme === 'dark';

  // --- Data Calculations ---
  
  const metrics = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalProfit = orders.reduce((acc, o) => acc + (o.totalProfit || 0), 0);
    const avgOrder = orders.length ? totalSales / orders.length : 0;
    const activeRest = users.filter(u => u.role === 'RESTAURANT').length;
    const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    
    return { totalSales, totalProfit, avgOrder, activeRest, margin };
  }, [orders, users]);

  const salesTrend = useMemo(() => {
    const days = isGeo ? ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      const revenue = 400 + (Math.random() * 800);
      const profit = 150 + (Math.random() * 300);
      return {
        name: day,
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        margin: Math.round((profit / revenue) * 100)
      };
    });
  }, [isGeo]);

  const categoryDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        const prod = products.find(p => p.id === i.productId);
        const cat = prod?.category || 'Other';
        dist[cat] = (dist[cat] || 0) + ((i.sellPrice || 0) * i.quantity);
      });
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [orders, products]);

  const topRestaurants = useMemo(() => {
    const restMap: Record<string, { name: string, total: number, orders: number }> = {};
    orders.forEach(o => {
      if (!restMap[o.restaurantId]) {
        restMap[o.restaurantId] = { name: o.restaurantName, total: 0, orders: 0 };
      }
      restMap[o.restaurantId].total += (o.totalCost || 0);
      restMap[o.restaurantId].orders += 1;
    });
    return Object.values(restMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  const topProductViews = useMemo(() => 
    products
      .map(p => ({ name: p.name, views: p.viewCount || 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
  , [products]);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            {t('admin.bi_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {isGeo ? 'ბაზრის დინამიკა და სტრატეგიული ანალიზი რეალურ დროში' : 'Real-time market dynamics and strategic analysis'}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="h-10">
             <Calendar className="h-4 w-4 mr-2" />
             {isGeo ? 'ბოლო 30 დღე' : 'Last 30 Days'}
           </Button>
           <Button variant="outline" size="sm" className="h-10">
             <Download className="h-4 w-4 mr-2" />
             {isGeo ? 'ექსპორტი' : 'Export'}
           </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('admin.total_revenue'), val: `$${metrics.totalSales.toLocaleString()}`, icon: DollarSign, trend: '+12%', color: '#3b82f6' },
          { label: t('admin.net_profit'), val: `$${metrics.totalProfit.toLocaleString()}`, icon: Target, trend: '+8%', color: '#10b981' },
          { label: isGeo ? 'მარჟა' : 'Avg Margin', val: `${metrics.margin.toFixed(1)}%`, icon: Percent, trend: '+1.4%', color: '#ec4899' },
          { label: t('admin.avg_order'), val: `$${metrics.avgOrder.toFixed(0)}`, icon: ShoppingBag, trend: '-2%', color: '#6366f1' },
          { label: isGeo ? 'ობიექტები' : 'Partners', val: metrics.activeRest, icon: Store, trend: '+5%', color: '#f59e0b' },
        ].map((m, i) => (
          <Card key={i} className="p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className={`absolute top-0 right-0 w-20 h-20 translate-x-8 translate-y-[-20%] rounded-full opacity-5 dark:opacity-10 transition-transform duration-700`} style={{ backgroundColor: m.color }} />
            <div className="flex justify-between items-start">
              <div className="z-10">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</p>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{m.val}</h4>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800" style={{ color: m.color }}>
                <m.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`flex items-center text-[9px] font-bold ${m.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {m.trend.startsWith('+') ? <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />}
                {m.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Main Row: Sales & Profit Area + Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Dynamic Area Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {isGeo ? 'გაყიდვების დინამიკა' : 'Sales Dynamic'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'შემოსავალი vs მოგება' : 'Revenue vs Profit'}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{isGeo ? 'შემოსავალი' : 'Revenue'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{isGeo ? 'მოგება' : 'Profit'}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDark ? 0.3 : 0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.3 : 0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    borderRadius: '16px', 
                    border: isDark ? '1px solid #334155' : 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    padding: '12px'
                  }}
                  itemStyle={{fontWeight: 900, fontSize: '12px', color: isDark ? '#cbd5e1' : '#1e293b'}}
                  labelStyle={{fontWeight: 900, marginBottom: '4px', color: isDark ? '#94a3b8' : '#64748b'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution Pie Chart */}
        <Card className="p-6 flex flex-col items-center">
          <div className="w-full text-left mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              {isGeo ? 'კატეგორიები' : 'Categories'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'ბრუნვის წილი' : 'Turnover Share'}</p>
          </div>
          <div className="w-full h-[320px] min-w-0 mt-4">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie 
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  data={categoryDistribution} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={65} 
                  outerRadius={90} 
                  dataKey="value"
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* New Row: Profit Margin Trend & Category Volume Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profit Margin Trend Line Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Percent className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                {isGeo ? 'მოგების მარჟის ტრენდი' : 'Profit Margin Trend'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'პროცენტული მაჩვენებელი' : 'Percentage performance'}</p>
            </div>
          </div>
          <div className="w-full h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} unit="%" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line type="monotone" dataKey="margin" stroke="#ec4899" strokeWidth={4} dot={{ r: 6, fill: "#ec4899", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Sales Volume Bar Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                {isGeo ? 'გაყიდვები კატეგორიებით' : 'Sales by Category'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'მოცულობა დოლარებში' : 'Volume in USD'}</p>
            </div>
          </div>
          <div className="w-full h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryDistribution} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#cbd5e1' : '#1e293b', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#cbd5e1' : '#1e293b', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                   cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}}
                   contentStyle={{
                     backgroundColor: isDark ? '#0f172a' : '#fff',
                     borderRadius: '12px',
                     border: 'none'
                   }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Bottom Insights Row: Popular Products & Top Restaurants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Product Views Bar Chart */}
        <Card className="p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                {isGeo ? 'პოპულარული პროდუქტები' : 'Popular Products'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'ნახვების რაოდენობა' : 'Total Views'}</p>
            </div>
            <Badge variant="outline" className="h-6">TOP 6</Badge>
          </div>
          <div className="w-full h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductViews} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: isDark ? '#cbd5e1' : '#1e293b', fontSize: 10, fontWeight: 800}} 
                  width={100}
                />
                <Tooltip 
                   cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}}
                   contentStyle={{
                     backgroundColor: isDark ? '#0f172a' : '#fff',
                     borderRadius: '12px', 
                     border: isDark ? '1px solid #334155' : 'none', 
                     boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                   }}
                   itemStyle={{color: isDark ? '#cbd5e1' : '#1e293b'}}
                />
                <Bar dataKey="views" radius={[0, 10, 10, 0]} barSize={25}>
                  {topProductViews.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Performing Restaurants */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {isGeo ? 'წამყვანი ობიექტები' : 'Top Restaurants'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'ჯამური ბრუნვა' : 'Total Revenue'}</p>
            </div>
            <Badge variant="success" className="h-6">MVP</Badge>
          </div>
          <div className="space-y-4">
            {topRestaurants.map((rest, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md border border-slate-100 dark:border-slate-800 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-slate-100 text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">{rest.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                      {rest.orders} {isGeo ? 'შეკვეთა' : 'Orders'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">${rest.total.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase mt-0.5">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                    +4.2%
                  </div>
                </div>
              </div>
            ))}
            {topRestaurants.length === 0 && (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                 {isGeo ? 'მონაცემები არ მოიძებნა' : 'No data found'}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
