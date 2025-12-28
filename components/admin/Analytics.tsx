
import React, { useState, useMemo } from 'react';
import { useApp } from '../../App';
import { Card, Badge, Button } from '../ui/Shared';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, PieChart, Pie, Sector
} from 'recharts';
import { 
  BarChart3, TrendingUp, ShoppingBag, 
  DollarSign, Target, PieChart as PieIcon, 
  Store, Percent, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            {t('admin.bi_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {isGeo ? 'ბიზნესის დინამიკა და სტრატეგიული ანალიზი რეალურ დროში' : 'Real-time market dynamics and strategic analysis'}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="h-11">
             <Download className="h-4 w-4 mr-2" />
             {isGeo ? 'ექსპორტი' : 'Export'}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('admin.total_revenue'), val: `$${metrics.totalSales.toLocaleString()}`, icon: DollarSign, trend: '+12%', color: '#3b82f6' },
          { label: t('admin.net_profit'), val: `$${metrics.totalProfit.toLocaleString()}`, icon: Target, trend: '+8%', color: '#10b981' },
          { label: isGeo ? 'საშ. მარჟა' : 'Avg Margin', val: `${metrics.margin.toFixed(1)}%`, icon: Percent, trend: '+1.4%', color: '#ec4899' },
          { label: t('admin.avg_order'), val: `$${metrics.avgOrder.toFixed(0)}`, icon: ShoppingBag, trend: '-2%', color: '#6366f1' },
          { label: isGeo ? 'პარტნიორი' : 'Partners', val: metrics.activeRest, icon: Store, trend: '+5%', color: '#f59e0b' },
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
            <div className={`mt-3 text-[10px] font-bold ${m.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{m.trend} vs last month</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" /> {isGeo ? 'გაყიდვების დინამიკა' : 'Sales Trends'}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 h-[400px]">
          <h3 className="text-lg font-black dark:text-slate-100 mb-6 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-indigo-500" /> {isGeo ? 'კატეგორიები' : 'Categories'}
          </h3>
          <ResponsiveContainer width="100%" height="100%">
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
        </Card>
      </div>
    </div>
  );
};
