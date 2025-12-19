
import React, { useState, useMemo } from 'react';
import { useApp } from '../../App';
import { Card, Button, Badge } from '../ui/Shared';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, PieChart, Pie, Sector
} from 'recharts';
import { 
  Sparkles, Loader2, BarChart3, TrendingUp, Users, ShoppingBag, 
  DollarSign, Target, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, 
  Store, Package, Zap 
} from 'lucide-react';
import { generateAIInsights } from '../../services/geminiService';
import { AnalyticsData, OrderStatus } from '../../types';
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
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(0);

  const isGeo = i18n.language === 'ka';
  const isDark = theme === 'dark';

  // --- Data Calculations ---
  
  const metrics = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalProfit = orders.reduce((acc, o) => acc + (o.totalProfit || 0), 0);
    const avgOrder = orders.length ? totalSales / orders.length : 0;
    const activeRest = users.filter(u => u.role === 'RESTAURANT').length;
    
    return { totalSales, totalProfit, avgOrder, activeRest };
  }, [orders, users]);

  const salesTrend = useMemo(() => {
    const days = isGeo ? ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      name: day,
      revenue: 400 + (Math.random() * 800),
      profit: 150 + (Math.random() * 300)
    }));
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

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    const analyticsPayload: AnalyticsData = {
      totalSales: metrics.totalSales,
      totalOrders: orders.length,
      totalProfit: metrics.totalProfit,
      topProducts: products.map(p => ({ name: p.name, value: p.viewCount || 0 })),
      salesTrend: []
    };
    const result = await generateAIInsights(analyticsPayload);
    setAiInsight(result);
    setLoadingAi(false);
  };

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
        <Button 
          onClick={handleGenerateInsights} 
          disabled={loadingAi} 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white dark:text-white h-12 px-8 shadow-xl shadow-indigo-100 dark:shadow-none border-none relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {loadingAi ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
          <span className="font-black uppercase tracking-wider text-xs">{t('admin.ask_ai')}</span>
        </Button>
      </div>

      {/* AI Report Section */}
      {aiInsight && (
        <Card className="p-8 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-50/50 dark:shadow-none animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-5">
             <Zap className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
           </div>
           <h3 className="text-xl font-black text-indigo-950 dark:text-indigo-100 mb-6 flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
               <Sparkles className="h-5 w-5 text-white" />
             </div>
             {t('admin.ai_report')}
             <Badge variant="outline" className="ml-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950">GEN-3 PRO</Badge>
           </h3>
           <div className="prose prose-indigo dark:prose-invert max-w-none text-indigo-900/80 dark:text-indigo-300 font-medium leading-relaxed bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/60 dark:border-slate-800">
             <div className="whitespace-pre-line text-sm md:text-base">
               {aiInsight}
             </div>
           </div>
        </Card>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('admin.total_revenue'), val: `$${metrics.totalSales.toLocaleString()}`, icon: DollarSign, trend: '+12%', color: 'blue' },
          { label: t('admin.net_profit'), val: `$${metrics.totalProfit.toLocaleString()}`, icon: Target, trend: '+8%', color: 'emerald' },
          { label: t('admin.avg_order'), val: `$${metrics.avgOrder.toFixed(0)}`, icon: ShoppingBag, trend: '-2%', color: 'indigo' },
          { label: isGeo ? 'აქტიური პარტნიორი' : 'Active Partners', val: metrics.activeRest, icon: Store, trend: '+5%', color: 'amber' },
        ].map((m, i) => (
          <Card key={i} className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className={`absolute top-0 right-0 w-24 h-24 translate-x-8 translate-y-[-20%] rounded-full opacity-5 dark:opacity-10 transition-transform duration-700`} style={{ backgroundColor: m.color }} />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.label}</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight">{m.val}</h4>
              </div>
              <div className={`p-2.5 rounded-xl ${
                m.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                m.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                m.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              }`}>
                <m.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`flex items-center text-[10px] font-bold ${m.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/30'} px-2 py-0.5 rounded-full`}>
                {m.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {m.trend}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">{isGeo ? 'ბოლო 7 დღე' : 'Last 7 Days'}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{isGeo ? 'შემოსავალი' : 'Revenue'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{isGeo ? 'მოგება' : 'Profit'}</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProf)" />
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
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1">{isGeo ? 'განაწილება მოცულობის მიხედვით' : 'Distribution by Volume'}</p>
          </div>
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  data={categoryDistribution} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={85} 
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

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Product Views Bar Chart */}
        <Card className="p-6">
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                    <ArrowUpRight className="h-2 w-2" />
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
