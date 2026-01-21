
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../App';
import { Button, Input, Card, Badge, Modal } from '../ui/Shared';
import { FilterChips, FilterChip } from '../ui/FilterChips';
import { DateRangePicker, DatePreset } from '../ui/DateRangePicker';
import { OrderStatus, Order, UserRole, OrderItem } from '../../types';
import { Check, Truck, Eye, DollarSign, ShoppingBag, Wallet, AlertTriangle, MessageSquare, Clock, Search, Filter, X, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OrderManagerProps {
  onCompanyClick?: (restaurantId: string) => void;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ onCompanyClick }) => {
  const { t, i18n } = useTranslation();
  const { orders, updateOrderStatus, updateOrderPricing, updateProductCostPrice, updateOrderItems, users, user } = useApp();
  const drivers = users.filter(u => u.role === UserRole.DRIVER);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pricingMode, setPricingMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [priceEdits, setPriceEdits] = useState<OrderItem[]>([]);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DatePreset>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');

  // Get unique restaurants from orders
  const restaurants = useMemo(() => {
    const uniqueRestaurants = new Map<string, string>();
    orders.forEach(order => {
      if (!uniqueRestaurants.has(order.restaurantId)) {
        uniqueRestaurants.set(order.restaurantId, order.restaurantName);
      }
    });
    return Array.from(uniqueRestaurants, ([id, name]) => ({ id, name }));
  }, [orders]);

  // Aggregation view logic (Shopping List)
  const shoppingList = useMemo(() => {
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);
    const summary: Record<string, { productId: string, name: string, quantity: number, unit: string, costPrice?: number }> = {};

    confirmedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!summary[item.productId]) {
          summary[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            unit: item.unit,
            costPrice: item.costPrice
          };
        }
        summary[item.productId].quantity += item.quantity;
        // Take the latest costPrice if set
        if (item.costPrice !== undefined) {
          summary[item.productId].costPrice = item.costPrice;
        }
      });
    });
    return Object.values(summary);
  }, [orders]);

  // Calculate total purchase cost for shopping list
  const totalPurchaseCost = useMemo(() => {
    return shoppingList.reduce((sum, item) => {
      if (item.costPrice) {
        return sum + (item.quantity * item.costPrice);
      }
      return sum;
    }, 0);
  }, [shoppingList]);

  // State for cost price inputs in shopping list
  const [costPriceInputs, setCostPriceInputs] = useState<Record<string, string>>({});

  // Status mapping for filter labels
  const getStatusLabel = (status: string) => {
    switch (status) {
        case OrderStatus.PENDING: return t('status.pending');
        case OrderStatus.CONFIRMED: return t('status.confirmed');
        case OrderStatus.OUT_FOR_DELIVERY: return t('status.out_for_delivery');
        case OrderStatus.DELIVERED: return t('status.delivered');
        case OrderStatus.COMPLETED: return t('status.completed');
        default: return t('status.all');
    }
  };

  // Status counts for badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    Object.values(OrderStatus).forEach(status => {
      counts[status] = orders.filter(o => o.status === status).length;
    });
    return counts;
  }, [orders]);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Search filter (ID, restaurant name, product name)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(searchLower) ||
        order.restaurantName.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchLower))
      );
    }

    // Restaurant filter
    if (restaurantFilter !== 'all') {
      result = result.filter(order => order.restaurantId === restaurantFilter);
    }

    // Date filter
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

      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (filterEndDate) {
          return orderDate >= filterStartDate && orderDate <= filterEndDate;
        }
        return orderDate >= filterStartDate;
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, search, restaurantFilter, dateFilter, customDateRange]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: FilterChip[] = [];

    if (search) {
      chips.push({ id: 'search', label: t('filters.search'), value: search });
    }
    if (statusFilter !== 'All') {
      chips.push({ id: 'status', label: t('filters.status'), value: getStatusLabel(statusFilter) });
    }
    if (restaurantFilter !== 'all') {
      const restaurant = restaurants.find(r => r.id === restaurantFilter);
      chips.push({ id: 'restaurant', label: t('filters.restaurant'), value: restaurant?.name || restaurantFilter });
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
  }, [search, statusFilter, restaurantFilter, dateFilter, customDateRange, t, restaurants]);

  const handleRemoveChip = useCallback((chipId: string) => {
    switch (chipId) {
      case 'search': setSearch(''); break;
      case 'status': setStatusFilter('All'); break;
      case 'restaurant': setRestaurantFilter('all'); break;
      case 'date':
        setDateFilter('all');
        setCustomDateRange({ start: '', end: '' });
        break;
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('All');
    setRestaurantFilter('all');
    setDateFilter('all');
    setCustomDateRange({ start: '', end: '' });
  }, []);

  const handleDateFilterChange = useCallback((preset: DatePreset, customRange?: { start: string; end: string }) => {
    setDateFilter(preset);
    if (customRange) {
      setCustomDateRange(customRange);
    }
  }, []);

  const handleOpenOrder = (order: Order, mode: 'view' | 'pricing' | 'edit') => {
    setSelectedOrder(order);
    setPricingMode(mode === 'pricing');
    setEditMode(mode === 'edit');
    if (mode === 'pricing') {
      setPriceEdits(order.items.map(item => ({
        ...item,
        costPrice: item.costPrice || 0,
        sellPrice: item.sellPrice || 0
      })));
    }
    if (mode === 'edit') {
      setEditItems(order.items.map(item => ({ ...item })));
    }
  };

  const handleEditQuantityChange = (index: number, newQuantity: number) => {
    const newItems = [...editItems];
    const originalQty = newItems[index].originalQuantity ?? newItems[index].quantity;
    newItems[index] = {
      ...newItems[index],
      quantity: newQuantity,
      originalQuantity: originalQty !== newQuantity ? originalQty : undefined
    };
    setEditItems(newItems);
  };

  const saveOrderEdit = () => {
    if (selectedOrder && user) {
      updateOrderItems(selectedOrder.id, editItems, user.name);
      setSelectedOrder(null);
      setEditMode(false);
    }
  };

  // Check if order can be edited by admin (not delivered and not completed)
  const canAdminEdit = (order: Order) => {
    return order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED;
  };

  const handlePriceChange = (index: number, field: 'costPrice' | 'sellPrice', value: string) => {
    const newItems = [...priceEdits];
    newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 };
    setPriceEdits(newItems);
  };

  const savePricing = () => {
    if (selectedOrder) {
      updateOrderPricing(selectedOrder.id, priceEdits);
      setSelectedOrder(null);
    }
  };

  const handleAssignDriver = (driverId: string) => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, OrderStatus.OUT_FOR_DELIVERY, driverId);
      setSelectedOrder(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Shopping List Aggregation */}
      <Card className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" /> {t('orders.shopping_list_title')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{t('orders.shopping_list_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            {totalPurchaseCost > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                <Wallet className="h-3 w-3 mr-1" />
                {totalPurchaseCost.toFixed(2)}₾
              </Badge>
            )}
            <Badge variant="outline">{shoppingList.length} {t('common.items')}</Badge>
          </div>
        </div>
        {shoppingList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shoppingList.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</div>
                  <div className="text-blue-600 dark:text-blue-400 font-black text-lg">{item.quantity} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">{item.unit}</span></div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('orders.cost')}:</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-20 h-8 text-sm"
                    value={costPriceInputs[item.productId] ?? (item.costPrice || '')}
                    onChange={(e) => setCostPriceInputs(prev => ({ ...prev, [item.productId]: e.target.value }))}
                  />
                  <span className="text-xs text-slate-400">₾</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      const price = parseFloat(costPriceInputs[item.productId] || '0');
                      if (price > 0) {
                        updateProductCostPrice(item.productId, price);
                        setCostPriceInputs(prev => ({ ...prev, [item.productId]: '' }));
                      }
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
                {item.costPrice && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center justify-between">
                    <span>✓ {t('orders.cost')}: {item.costPrice}₾</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      = {(item.quantity * item.costPrice).toFixed(2)}₾
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-500 italic text-sm">{t('orders.empty_shopping_list')}</p>
          </div>
        )}
      </Card>

      {/* Orders List */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">{t('orders.title')}</h2>
        </div>

        {/* Filter Bar */}
        <Card className="p-3 sm:p-4 mb-6">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('filters.search_orders')}
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

            {/* Filters Row - stack on mobile, horizontal on tablet+ */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-initial h-10 sm:h-11 px-3 sm:px-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="All">{t('orders.all_statuses')} ({statusCounts['All'] || 0})</option>
                  {Object.values(OrderStatus).map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)} ({statusCounts[s] || 0})</option>
                  ))}
                </select>
              </div>

              {/* Restaurant Filter */}
              {restaurants.length > 0 && (
                <select
                  value={restaurantFilter}
                  onChange={(e) => setRestaurantFilter(e.target.value)}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="all">{t('filters.all_restaurants')}</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}

              {/* Date Filter */}
              <DateRangePicker
                value={dateFilter}
                onChange={handleDateFilterChange}
                customRange={customDateRange}
              />
            </div>
          </div>

          {/* Active Filter Chips */}
          <FilterChips
            chips={activeChips}
            onRemove={handleRemoveChip}
            onClearAll={handleClearAllFilters}
          />

          {/* Results count */}
          <div className={`mt-3 text-xs font-medium text-slate-400 dark:text-slate-500 ${activeChips.length > 0 ? 'pt-3' : ''}`}>
            {t('filters.results_count', { count: filteredOrders.length })}
          </div>
        </Card>

        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 dark:shadow-none rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100 dark:divide-slate-800 table-auto">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">{t('orders.table_id_restaurant')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{t('orders.table_status')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{t('orders.table_financials')}</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{t('orders.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => {
                  const assignedDriver = users.find(u => u.id === order.driverId);
                  const needsPricing = order.status === OrderStatus.CONFIRMED && (!order.totalCost || order.totalCost === 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <div
                          className={`text-sm font-bold text-slate-900 dark:text-slate-100 ${onCompanyClick ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors' : ''}`}
                          onClick={() => onCompanyClick?.(order.restaurantId)}
                        >
                          {order.restaurantName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 truncate max-w-[200px]">#{order.id.substring(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant={
                            order.status === OrderStatus.PENDING ? 'warning' :
                            order.status === OrderStatus.CONFIRMED ? 'default' :
                            order.status === OrderStatus.COMPLETED ? 'success' : 'outline'
                          }>
                            {getStatusLabel(order.status)}
                          </Badge>
                          {assignedDriver && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                              <Truck className="h-3 w-3 shrink-0" />
                              <span className="truncate">{assignedDriver.name}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {needsPricing ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50 whitespace-nowrap">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden sm:inline">{t('orders.pricing_required')}</span>
                            <span className="sm:hidden">!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            <Wallet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            {order.totalCost ? `₾${order.totalCost.toFixed(2)}` : '—'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 min-w-[180px] md:min-w-[280px]">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {order.status === OrderStatus.PENDING && (
                            <Button size="sm" onClick={() => updateOrderStatus(order.id, OrderStatus.CONFIRMED)} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none whitespace-nowrap px-2">
                              <Check className="h-3 w-3 shrink-0" /> <span className="hidden lg:inline ml-1">{t('common.confirm')}</span>
                            </Button>
                          )}
                          {order.status === OrderStatus.CONFIRMED && (
                            <Button size="sm" variant={needsPricing ? "primary" : "secondary"} onClick={() => handleOpenOrder(order, 'pricing')} className="whitespace-nowrap px-2">
                              <DollarSign className="h-3 w-3 shrink-0" /> <span className="hidden lg:inline ml-1">{t('common.price')}</span>
                            </Button>
                          )}
                          {order.status === OrderStatus.CONFIRMED && !needsPricing && (
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none whitespace-nowrap px-2" onClick={() => handleOpenOrder(order, 'view')}>
                              <Truck className="h-3 w-3 shrink-0" /> <span className="hidden lg:inline ml-1">{t('common.assign')}</span>
                            </Button>
                          )}
                          {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenOrder(order, 'view')} className="whitespace-nowrap px-2">
                              <Eye className="h-3 w-3 shrink-0" /> <span className="hidden lg:inline ml-1">{t('common.details')}</span>
                            </Button>
                          )}
                          {canAdminEdit(order) && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenOrder(order, 'edit')} className="border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 whitespace-nowrap px-2">
                              <Edit3 className="h-3 w-3 shrink-0" /> <span className="hidden lg:inline ml-1">{t('common.edit')}</span>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleOpenOrder(order, 'view')} className="text-slate-400 dark:text-slate-500 px-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details/Pricing/Edit Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => { setSelectedOrder(null); setEditMode(false); }}
        title={editMode ? t('orders.modal_edit_title') : pricingMode ? t('orders.modal_pricing_title') : t('orders.modal_details_title')}
      >
        {selectedOrder && (
          <div className="space-y-4 sm:space-y-6">
            {/* Restaurant name badge */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t('filters.restaurant')}:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{selectedOrder.restaurantName}</span>
            </div>

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">{t('orders.notes')}</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Card-based layout, Desktop: Table */}
            <div className="space-y-3 sm:hidden">
              {(editMode ? editItems : pricingMode ? priceEdits : selectedOrder.items).map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{item.unit}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {editMode ? (
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          className="w-20 h-9 text-sm text-center font-black"
                          value={item.quantity}
                          onChange={(e) => handleEditQuantityChange(idx, parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="font-black text-blue-600 dark:text-blue-400">x{item.quantity}</span>
                      )}
                      {item.originalQuantity !== undefined && item.originalQuantity !== item.quantity && (
                        <div className="text-[10px] text-orange-500 dark:text-orange-400 mt-1">
                          {t('orders.was')}: {item.originalQuantity}
                        </div>
                      )}
                    </div>
                  </div>
                  {pricingMode && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t('orders.cost')}</div>
                        {item.costPrice ? (
                          <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">{item.costPrice}₾</span>
                        ) : (
                          <span className="text-amber-500 text-xs font-medium">—</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t('orders.sell')}</div>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          className="w-full h-9 text-sm"
                          placeholder="0.00"
                          value={item.sellPrice || ''}
                          onChange={(e) => handlePriceChange(idx, 'sellPrice', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
               <table className="min-w-full text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-800">
                   <tr>
                     <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_product')}</th>
                     <th className="p-4 text-center font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_qty')}</th>
                     {pricingMode && (
                       <>
                         <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.cost')} ₾</th>
                         <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.sell')} ₾</th>
                       </>
                     )}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {(editMode ? editItems : pricingMode ? priceEdits : selectedOrder.items).map((item, idx) => (
                     <tr key={idx}>
                       <td className="p-4">
                         <div className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</div>
                         <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{item.unit}</div>
                       </td>
                       <td className="p-4 text-center">
                         {editMode ? (
                           <Input
                             type="number"
                             step="0.1"
                             className="w-24 h-9 p-2 text-center font-black"
                             value={item.quantity}
                             onChange={(e) => handleEditQuantityChange(idx, parseFloat(e.target.value) || 0)}
                           />
                         ) : (
                           <span className="font-black text-slate-600 dark:text-slate-400">x{item.quantity}</span>
                         )}
                         {item.originalQuantity !== undefined && item.originalQuantity !== item.quantity && (
                           <div className="text-[10px] text-orange-500 dark:text-orange-400 mt-1">
                             {t('orders.was')}: {item.originalQuantity}
                           </div>
                         )}
                       </td>
                       {pricingMode && (
                         <>
                           <td className="p-4">
                             {item.costPrice ? (
                               <span className="text-slate-600 dark:text-slate-400 font-medium">{item.costPrice}</span>
                             ) : (
                               <span className="text-amber-500 text-xs font-medium">—</span>
                             )}
                           </td>
                           <td className="p-4">
                             <Input
                               type="number"
                               step="0.1"
                               className="w-24 h-9 p-2"
                               value={item.sellPrice || ''}
                               onChange={(e) => handlePriceChange(idx, 'sellPrice', e.target.value)}
                             />
                           </td>
                         </>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            {editMode ? (
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                 <Button variant="outline" onClick={() => { setSelectedOrder(null); setEditMode(false); }} className="w-full sm:w-auto">{t('common.cancel')}</Button>
                 <Button onClick={saveOrderEdit} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white sm:px-8 border-none">{t('orders.save_changes')}</Button>
              </div>
            ) : pricingMode ? (
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                 <Button variant="outline" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto">{t('common.cancel')}</Button>
                 <Button onClick={savePricing} className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 dark:text-slate-900 sm:px-8 border-none">{t('orders.save_pricing')}</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Driver Assignment Grid */}
                {selectedOrder.status === OrderStatus.CONFIRMED && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('orders.assign_driver')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {drivers.map(driver => (
                        <button
                          key={driver.id}
                          onClick={() => handleAssignDriver(driver.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 active:scale-[0.98] ${
                            selectedOrder.driverId === driver.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                           <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">
                             {driver.name.charAt(0)}
                           </div>
                           <span className="text-sm font-bold truncate dark:text-slate-200">{driver.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                   <Button variant="secondary" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto">{t('common.close')}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
