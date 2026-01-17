
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { useApp } from '../../App';
import { Card, Button, Badge, Input, Modal } from '../ui/Shared';
import { FilterChips, FilterChip } from '../ui/FilterChips';
import { DateRangePicker, DatePreset } from '../ui/DateRangePicker';
import { Product, OrderStatus, Order } from '../../types';
import { ShoppingCart, Search, Clock, Plus, Minus, MapPin, Phone, Save, AlertCircle, CheckCircle2, Package, MessageSquare, Eye, Filter, Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Catalog = () => {
  const { t, i18n } = useTranslation();
  const { products, createOrder, user, orders, refreshData } = useApp();
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Refresh data on mount to ensure catalog is populated
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const activeOrder = orders.find(o => o.restaurantId === user?.id && o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.DELIVERED);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const setCartQuantity = (productId: string, quantity: number) => {
    // Round to 1 decimal place for kg units
    const roundedQty = Math.round(quantity * 10) / 10;
    if (roundedQty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setCart(prev => prev.map(item =>
        item.product.id === productId ? { ...item, quantity: roundedQty } : item
      ));
    }
  };

  // Check if unit is weight-based (kg)
  const isWeightUnit = (unit: string) => unit.toLowerCase() === 'კგ';

  const handleOpenConfirm = () => {
    if (cart.length > 0) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleSubmit = () => {
    createOrder(cart, orderNotes);
    setCart([]);
    setOrderNotes('');
    setSubmitted(true);
    setIsConfirmModalOpen(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      // Ensure product is active and matches search
      p.isActive !== false && 
      p.name.toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        
        {/* Active Order Banner */}
        {activeOrder && !submitted && (
           <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-3">
               <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg">
                 <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
               </div>
               <div>
                 <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{t('restaurant.active_order_title')}</p>
                 <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    #{activeOrder.id} • {t(`status.${activeOrder.status.toLowerCase().replace(/ /g, '_')}` as any)}
                 </p>
               </div>
             </div>
             <Badge variant="warning">{t(`status.${activeOrder.status.toLowerCase().replace(/ /g, '_')}` as any)}</Badge>
           </div>
        )}

        <div className="mb-6 sticky top-0 bg-slate-50 dark:bg-slate-950 pt-2 pb-4 z-10 transition-colors border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('nav.products')}</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <Input 
              placeholder={t('common.search')} 
              className="pl-12 h-12 shadow-md dark:shadow-none border-none dark:bg-slate-900" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.length > 0 ? filteredProducts.map(product => (
            <Card key={product.id} className="flex items-center p-4 space-x-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
              <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{product.name}</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mt-1">
                  {product.unit} • {t('restaurant.price_tbd')}
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 transition-colors shrink-0" onClick={() => addToCart(product)}>
                <Plus className="h-4 w-4" />
              </Button>
            </Card>
          )) : (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 italic flex flex-col items-center">
               <Package className="h-12 w-12 mb-3 opacity-20" />
               <p>{t('restaurant.no_products')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-800 flex flex-col h-full lg:sticky lg:top-4 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-bold text-lg flex items-center text-slate-900 dark:text-slate-100">
            <ShoppingCart className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" /> {t('restaurant.cart_title')}
          </h3>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-5 max-h-[50vh] lg:max-h-[calc(100vh-280px)]">
          {cart.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-bold">{t('restaurant.empty_cart')}</p>
            </div>
          ) : (
            <>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 mr-4 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{item.product.name}</p>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                      {item.product.unit}
                    </p>
                  </div>
                  {isWeightUnit(item.product.unit) ? (
                    // Weight-based input (kg) - decimal input field
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) => setCartQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-center text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.product.unit}</span>
                    </div>
                  ) : (
                    // Count-based input - +/- buttons
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden shrink-0">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, -1)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-r border-slate-100 dark:border-slate-700"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-sm font-bold text-slate-900 dark:text-slate-100 min-w-[32px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, 1)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border-l border-slate-100 dark:border-slate-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('restaurant.notes')}</span>
                </div>
                <textarea 
                  className="w-full h-24 p-3 text-sm border-2 border-slate-100 dark:border-slate-800 bg-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium text-slate-900 dark:text-slate-100"
                  placeholder={t('restaurant.notes_placeholder')}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
           <Button
             className="w-full h-14 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg dark:shadow-none border-none text-base font-bold"
             disabled={cart.length === 0}
             onClick={handleOpenConfirm}
           >
             {t('restaurant.checkout_btn')}
           </Button>
        </div>
      </div>

      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)} 
        title={t('restaurant.confirm_title')}
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('restaurant.confirm_desc')}</p>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
             {cart.map((item, idx) => (
               <div key={idx} className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{item.product.name}</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">x{item.quantity} {item.product.unit}</span>
               </div>
             ))}
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1" onClick={() => setIsConfirmModalOpen(false)}>{t('common.cancel')}</Button>
             <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none" onClick={handleSubmit}>{t('common.submit')}</Button>
          </div>
        </div>
      </Modal>

      {submitted && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
           <CheckCircle2 className="h-6 w-6" />
           <span className="font-bold">{t('restaurant.order_submitted')}</span>
        </div>
      )}
    </div>
  );
};

const History = () => {
  const { t, i18n } = useTranslation();
  const { orders, updateOrderStatus, user, refreshData } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // URL-დან ფილტრების წაკითხვა
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState<DatePreset>((searchParams.get('date') as DatePreset) || 'all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: searchParams.get('dateStart') || '',
    end: searchParams.get('dateEnd') || ''
  });

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // URL-ში ფილტრების შენახვა
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateFilter !== 'all') params.set('date', dateFilter);
    if (dateFilter === 'custom' && customDateRange.start) params.set('dateStart', customDateRange.start);
    if (dateFilter === 'custom' && customDateRange.end) params.set('dateEnd', customDateRange.end);
    setSearchParams(params, { replace: true });
  }, [search, statusFilter, dateFilter, customDateRange, setSearchParams]);

  const showPrices = (status: OrderStatus) => {
      return [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(status);
  };

  // სტატუსების რაოდენობის დათვლა
  const statusCounts = useMemo(() => {
    const userOrders = orders.filter(o => o.restaurantId === user?.id);
    const counts: Record<string, number> = { all: userOrders.length };
    Object.values(OrderStatus).forEach(status => {
      counts[status] = userOrders.filter(o => o.status === status).length;
    });
    return counts;
  }, [orders, user?.id]);

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => o.restaurantId === user?.id);

    // ძებნა ID-ით ან პროდუქტის სახელით
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(searchLower) ||
        o.items.some(item => item.productName.toLowerCase().includes(searchLower))
      );
    }

    // სტატუსის ფილტრი
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // თარიღის ფილტრი
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterStartDate = new Date();
      let filterEndDate: Date | null = null;

      switch (dateFilter) {
        case 'today':
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          filterStartDate.setDate(now.getDate() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date();
          filterEndDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterStartDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterStartDate.setDate(now.getDate() - 30);
          break;
        case 'lastMonth':
          filterStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          filterEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            filterStartDate = new Date(customDateRange.start);
            filterEndDate = new Date(customDateRange.end);
            filterEndDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      result = result.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (filterEndDate) {
          return orderDate >= filterStartDate && orderDate <= filterEndDate;
        }
        return orderDate >= filterStartDate;
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, user?.id, search, statusFilter, dateFilter, customDateRange]);

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: OrderStatus.PENDING, label: t('status.pending') },
    { value: OrderStatus.CONFIRMED, label: t('status.confirmed') },
    { value: OrderStatus.OUT_FOR_DELIVERY, label: t('status.out_for_delivery') },
    { value: OrderStatus.DELIVERED, label: t('status.delivered') },
    { value: OrderStatus.COMPLETED, label: t('status.completed') },
  ];

  // აქტიური ფილტრების chips
  const activeChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (search) {
      chips.push({ id: 'search', label: t('filters.search'), value: search });
    }
    if (statusFilter !== 'all') {
      const statusLabel = statusOptions.find(s => s.value === statusFilter)?.label || statusFilter;
      chips.push({ id: 'status', label: t('filters.status'), value: statusLabel });
    }
    if (dateFilter !== 'all') {
      let dateLabel = '';
      switch (dateFilter) {
        case 'today': dateLabel = t('filters.today'); break;
        case 'yesterday': dateLabel = t('filters.yesterday'); break;
        case 'week': dateLabel = t('filters.last_7_days'); break;
        case 'month': dateLabel = t('filters.last_30_days'); break;
        case 'lastMonth': dateLabel = t('filters.last_month'); break;
        case 'custom': dateLabel = `${customDateRange.start} - ${customDateRange.end}`; break;
      }
      chips.push({ id: 'date', label: t('filters.date'), value: dateLabel });
    }

    return chips;
  }, [search, statusFilter, dateFilter, customDateRange, t]);

  const handleRemoveChip = useCallback((chipId: string) => {
    switch (chipId) {
      case 'search': setSearch(''); break;
      case 'status': setStatusFilter('all'); break;
      case 'date':
        setDateFilter('all');
        setCustomDateRange({ start: '', end: '' });
        break;
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomDateRange({ start: '', end: '' });
  }, []);

  const handleDateFilterChange = useCallback((preset: DatePreset, customRange?: { start: string; end: string }) => {
    setDateFilter(preset);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('nav.history')}</h2>

      {/* ფილტრები და ძებნა */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* ძებნა */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('history.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* სტატუსის ფილტრი */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({statusCounts[opt.value] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* თარიღის ფილტრი */}
          <DateRangePicker
            value={dateFilter}
            onChange={handleDateFilterChange}
            customRange={customDateRange}
          />
        </div>

        {/* აქტიური ფილტრების Chips */}
        <FilterChips
          chips={activeChips}
          onRemove={handleRemoveChip}
          onClearAll={handleClearAllFilters}
        />

        {/* შედეგების რაოდენობა */}
        <div className={`mt-3 text-xs font-medium text-slate-400 dark:text-slate-500 ${activeChips.length > 0 ? 'pt-3' : ''}`}>
          {t('history.results_count', { count: filteredOrders.length })}
        </div>
      </Card>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-16 text-center text-slate-400 dark:text-slate-600">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold">{t('restaurant.empty_history')}</p>
          </Card>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id} className="p-6 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">#{order.id}</h3>
                    <Badge variant={
                      order.status === OrderStatus.COMPLETED ? 'success' : 
                      order.status === OrderStatus.PENDING ? 'warning' : 'default'
                    }>
                      {t(`status.${order.status.toLowerCase().replace(/ /g, '_')}` as any)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex items-center gap-6">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{order.items.length} {t('common.items')}</span>
                    {showPrices(order.status) && order.totalCost && (
                       <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                         {t('restaurant.total')}: ₾{order.totalCost.toFixed(2)}
                       </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => setViewingOrder(order)} className="flex-1 sm:flex-none">
                    <Eye className="h-4 w-4 mr-2" /> {t('restaurant.details')}
                  </Button>
                  {order.status === OrderStatus.DELIVERED && (
                    <Button onClick={() => updateOrderStatus(order.id, OrderStatus.COMPLETED)} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex-1 sm:flex-none shadow-lg shadow-emerald-50 dark:shadow-none">
                      {t('restaurant.confirm_receive')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Details Modal */}
      <Modal 
        isOpen={!!viewingOrder} 
        onClose={() => setViewingOrder(null)} 
        title={`${t('orders.modal_details_title')}: #${viewingOrder?.id}`}
      >
        {viewingOrder && (
           <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_product')}</th>
                      <th className="p-4 text-center font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_qty')}</th>
                      {showPrices(viewingOrder.status) && (
                        <th className="p-4 text-right font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_price')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                        <td className="p-4 text-center font-black text-slate-600 dark:text-slate-400">x{item.quantity} {item.unit}</td>
                        {showPrices(viewingOrder.status) && (
                          <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            ₾{item.sellPrice ? item.sellPrice.toFixed(2) : '0.00'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {showPrices(viewingOrder.status) && viewingOrder.totalCost && (
                    <tfoot className="bg-slate-900 dark:bg-slate-950 text-white">
                       <tr>
                         <td colSpan={2} className="p-4 text-right font-bold text-xs uppercase tracking-widest">{t('restaurant.total_payable')}</td>
                         <td className="p-4 text-right font-black text-lg">₾{viewingOrder.totalCost.toFixed(2)}</td>
                       </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {!showPrices(viewingOrder.status) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center gap-3">
                   <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                   <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                     {t('restaurant.prices_visible_info')}
                   </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setViewingOrder(null)}>{t('common.close')}</Button>
              </div>
           </div>
        )}
      </Modal>
    </div>
  );
}

const Settings = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useApp();
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    locationLink: user?.locationLink || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateUser({ ...user, ...formData });
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('restaurant.settings_title')}</h2>
      <Card className="p-8 space-y-6 shadow-xl dark:shadow-none border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{t('users.phone')}</label>
          <div className="relative">
            <Input 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              placeholder="555-00-00-00" 
              className="pl-12"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{t('restaurant.location_label')}</label>
          <div className="relative">
            <Input 
              value={formData.locationLink} 
              onChange={(e) => setFormData({...formData, locationLink: e.target.value})} 
              placeholder="https://maps.app.goo.gl/..." 
              className="pl-12"
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium italic">{t('restaurant.location_help')}</p>
        </div>

        <div className="pt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="h-12 px-10 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none shadow-lg dark:shadow-none">
             {saving ? t('common.loading') : t('common.save')}
             <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const RestaurantDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};
