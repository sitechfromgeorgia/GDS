
import React, { useState } from 'react';
import { useApp } from '../../App';
// Fix: Added Badge to the imported components from Shared.tsx
import { Card, Button, Badge } from '../ui/Shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, Loader2, BarChart3 } from 'lucide-react';
import { generateAIInsights } from '../../services/geminiService';
import { AnalyticsData } from '../../types';
import { useTranslation } from 'react-i18next';

export const Analytics = () => {
  const { t } = useTranslation();
  const { orders, products } = useApp();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Prepare data
  const totalSales = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
  const totalProfit = orders.reduce((acc, o) => acc + (o.totalProfit || 0), 0);
  
  const weeklyTrendData = [
    { name: 'Mon', sales: 400 },
    { name: 'Tue', sales: 300 },
    { name: 'Wed', sales: 600 },
    { name: 'Thu', sales: totalSales > 1000 ? totalSales / 2 : 200 }, // Mock dynamic
    { name: 'Fri', sales: 450 },
  ];

  const productViewsData = products
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      views: p.viewCount || 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8); // Top 8 products

  const handleGenerateInsights = async () => {
    setLoadingAi(true);
    const analyticsPayload: AnalyticsData = {
      totalSales,
      totalOrders: orders.length,
      totalProfit,
      topProducts: products.map(p => ({ name: p.name, value: p.viewCount || 0 })),
      salesTrend: []
    };
    const result = await generateAIInsights(analyticsPayload);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">{t('admin.bi_title')}</h2>
        <Button onClick={handleGenerateInsights} disabled={loadingAi} className="bg-purple-600 hover:bg-purple-700 h-12 shadow-lg shadow-purple-100">
          {loadingAi ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {t('admin.ask_ai')}
        </Button>
      </div>

      {aiInsight && (
        <Card className="p-6 bg-purple-50 border-purple-100 animate-in fade-in slide-in-from-top-2">
           <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
             <Sparkles className="h-5 w-5 mr-2" /> {t('admin.ai_report')}
           </h3>
           <div className="prose prose-sm text-purple-800 whitespace-pre-line font-medium leading-relaxed">
             {aiInsight}
           </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6 text-slate-800">{t('admin.weekly_trend')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              პროდუქტების ნახვები
            </h3>
            <Badge variant="outline">ტოპ 8</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productViewsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                  {productViewsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="p-8 border-l-4 border-l-emerald-500 shadow-sm">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('admin.net_profit')}</p>
           <p className="text-5xl font-black text-emerald-600 mt-2 tracking-tight">+${totalProfit.toFixed(2)}</p>
           <p className="text-[11px] text-slate-400 mt-3 font-medium italic">{t('admin.profit_desc')}</p>
         </Card>
         <Card className="p-8 border-l-4 border-l-blue-500 shadow-sm">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('admin.avg_order')}</p>
           <p className="text-5xl font-black text-blue-600 mt-2 tracking-tight">${(orders.length ? totalSales / orders.length : 0).toFixed(2)}</p>
         </Card>
      </div>
    </div>
  );
};
