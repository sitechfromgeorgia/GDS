
import React, { useState, useMemo } from 'react';
import { useApp } from '../../App';
import { Button, Input, Card, Badge, Modal } from '../ui/Shared';
import { OrderStatus, Order, UserRole, OrderItem } from '../../types';
import { Check, Truck, Eye, DollarSign, ShoppingBag, Filter, Calendar, X, TrendingUp, Wallet, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OrderManager = () => {
  const { t, i18n } = useTranslation();
  const { orders, updateOrderStatus, updateOrderPricing, users } = useApp();
  const drivers = users.filter(u => u.role === UserRole.DRIVER);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pricingMode, setPricingMode] = useState(false);
  const [priceEdits, setPriceEdits] = useState<OrderItem[]>([]);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Aggregation view logic (Shopping List)
  const shoppingList = useMemo(() => {
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);
    const summary: Record<string, { name: string, quantity: number, unit: string }> = {};
    
    confirmedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!summary[item.productId]) {
          summary[item.productId] = { name: item.productName, quantity: 0, unit: item.unit };
        }
        summary[item.productId].quantity += item.quantity;
      });
    });
    return Object.values(summary);
  }, [orders]);

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

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;

      if (dateFilter.start) {
        const orderDate = new Date(order.createdAt).setHours(0,0,0,0);
        const filterStart = new Date(dateFilter.start).setHours(0,0,0,0);
        if (orderDate < filterStart) return false;
      }

      if (dateFilter.end) {
        const orderDate = new Date(order.createdAt).getTime();
        const filterEnd = new Date(dateFilter.end);
        filterEnd.setHours(23, 59, 59, 999);
        if (orderDate > filterEnd.getTime()) return false;
      }

      return true;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, dateFilter]);

  const handleOpenOrder = (order: Order, mode: 'view' | 'pricing') => {
    setSelectedOrder(order);
    setPricingMode(mode === 'pricing');
    if (mode === 'pricing') {
      // Default to 0 or current values
      setPriceEdits(order.items.map(item => ({
        ...item,
        costPrice: item.costPrice || 0,
        sellPrice: item.sellPrice || 0
      }))); 
    }
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

  const clearFilters = () => {
    setStatusFilter('All');
    setDateFilter({ start: '', end: '' });
  };

  return (
    <div className="space-y-8">
      {/* Shopping List Aggregation */}
      <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-blue-600" /> {t('orders.shopping_list_title')}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{t('orders.shopping_list_subtitle')}</p>
          </div>
          <Badge variant="outline">{shoppingList.length} {t('common.items')}</Badge>
        </div>
        {shoppingList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shoppingList.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                <div className="text-blue-600 font-black text-lg mt-1">{item.quantity} <span className="text-xs text-slate-400 font-bold uppercase">{item.unit}</span></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400 italic text-sm">{t('orders.empty_shopping_list')}</p>
          </div>
        )}
      </Card>

      {/* Filters & Order List */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t('orders.title')}</h2>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-5 items-center">
            <div className="flex items-center gap-2 w-full md:w-auto text-slate-500">
                <Filter className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('orders.filter_label')}</span>
            </div>

            <select 
                className="flex h-11 w-full md:w-56 rounded-xl border-2 border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="All">{t('orders.all_statuses')}</option>
                {Object.values(OrderStatus).map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
            </select>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        type="date" 
                        className="pl-12 w-full md:w-44 h-11 border-2" 
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                        placeholder={t('orders.start_date')}
                    />
                </div>
                <span className="text-slate-300 font-bold">-</span>
                <div className="relative w-full md:w-auto">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        type="date" 
                        className="pl-12 w-full md:w-44 h-11 border-2" 
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                        placeholder={t('orders.end_date')}
                    />
                </div>
            </div>

            {(statusFilter !== 'All' || dateFilter.start || dateFilter.end) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-slate-400 hover:text-red-600 font-bold text-xs uppercase">
                    <X className="h-4 w-4 mr-2" /> {t('orders.clear_filters')}
                </Button>
            )}
        </div>

        <div className="bg-white shadow-xl shadow-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('orders.table_id_restaurant')}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('orders.table_status')}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('orders.table_items')}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ფინანსები</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('orders.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const assignedDriver = users.find(u => u.id === order.driverId);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{order.restaurantName}</div>
                        <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">#{order.id} • {new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant={
                            order.status === OrderStatus.PENDING ? 'warning' :
                            order.status === OrderStatus.CONFIRMED ? 'default' :
                            order.status === OrderStatus.COMPLETED ? 'success' : 'outline'
                          }>
                            {getStatusLabel(order.status)}
                          </Badge>
                          {assignedDriver && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                              <Truck className="h-3 w-3" />
                              {assignedDriver.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-600">
                        {order.items.length} {t('common.items')}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                            <Wallet className="h-3.5 w-3.5 text-slate-400" />
                            {order.totalCost ? `$${order.totalCost.toFixed(2)}` : '-'}
                          </div>
                          {order.totalProfit !== undefined && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                              <TrendingUp className="h-3 w-3" />
                              Profit: ${order.totalProfit.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {order.status === OrderStatus.PENDING && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, OrderStatus.CONFIRMED)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                            <Check className="h-3 w-3 mr-1" /> {t('common.confirm')}
                          </Button>
                        )}
                        {order.status === OrderStatus.CONFIRMED && (
                          <Button size="sm" variant="secondary" onClick={() => handleOpenOrder(order, 'pricing')}>
                            <DollarSign className="h-3 w-3 mr-1" /> {t('common.price')}
                          </Button>
                        )}
                        {order.status === OrderStatus.CONFIRMED && order.totalCost !== undefined && (
                           <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={() => handleOpenOrder(order, 'view')}>
                            <Truck className="h-3 w-3 mr-1" /> {t('common.assign')}
                           </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleOpenOrder(order, 'view')} className="text-slate-400 hover:text-slate-900">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic">
                        {t('orders.no_orders_found')}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details/Pricing Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={pricingMode ? `${t('orders.modal_pricing_title')}: ${selectedOrder?.restaurantName}` : `${t('orders.modal_details_title')}: ${selectedOrder?.id}`}
      >
        {selectedOrder && (
          <div className="space-y-6 py-2">
            {/* Items Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
               <table className="min-w-full text-sm">
                 <thead>
                   <tr className="bg-slate-50">
                     <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('orders.table_product')}</th>
                     <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('orders.table_qty')}</th>
                     {pricingMode && <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('orders.table_cost')}</th>}
                     {pricingMode && <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('orders.table_sell')}</th>}
                     {!pricingMode && <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('orders.table_price')}</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {(pricingMode ? priceEdits : selectedOrder.items).map((item, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                       <td className="p-4">
                         <div className="font-bold text-slate-900">{item.productName}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</div>
                       </td>
                       <td className="p-4 font-black text-slate-600">x{item.quantity}</td>
                       {pricingMode ? (
                         <>
                           <td className="p-4">
                             <div className="relative">
                               <Input 
                                 type="number" 
                                 step="0.1" 
                                 className="w-24 h-10 border-slate-200 pl-6"
                                 value={item.costPrice || ''} 
                                 onChange={(e) => handlePriceChange(idx, 'costPrice', e.target.value)} 
                               />
                               <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                             </div>
                           </td>
                           <td className="p-4">
                             <div className="relative">
                               <Input 
                                 type="number" 
                                 step="0.1" 
                                 className="w-24 h-10 border-slate-200 pl-6"
                                 value={item.sellPrice || ''} 
                                 onChange={(e) => handlePriceChange(idx, 'sellPrice', e.target.value)} 
                               />
                               <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                             </div>
                           </td>
                         </>
                       ) : (
                         <td className="p-4 font-black text-slate-900">{item.sellPrice ? `$${item.sellPrice.toFixed(2)}` : 'TBD'}</td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            {/* Order Notes Section */}
            {!pricingMode && selectedOrder.notes && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{i18n.language === 'ka' ? 'შენიშვნა კლიენტისგან' : 'Notes from Client'}</span>
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">"{selectedOrder.notes}"</p>
              </div>
            )}

            {/* Financial Summary in Modal */}
            {pricingMode && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Profit</p>
                   <p className="text-xl font-black text-emerald-600">
                     ${priceEdits.reduce((acc, i) => acc + (((i.sellPrice || 0) - (i.costPrice || 0)) * i.quantity), 0).toFixed(2)}
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
                   <p className="text-xl font-black text-slate-900">
                     ${priceEdits.reduce((acc, i) => acc + ((i.sellPrice || 0) * i.quantity), 0).toFixed(2)}
                   </p>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-6 border-t border-slate-100">
              {pricingMode ? (
                <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
                  <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto font-bold text-slate-400">
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={savePricing} className="w-full sm:w-auto bg-slate-950 px-8 shadow-lg shadow-slate-200">
                    {t('orders.save_pricing')}
                  </Button>
                </div>
              ) : selectedOrder.status === OrderStatus.CONFIRMED && selectedOrder.totalCost !== undefined ? (
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                     <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                       <Truck className="h-4 w-4 text-indigo-600" />
                     </div>
                     <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{t('orders.assign_driver')}</span>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {drivers.map(driver => (
                      <button 
                        key={driver.id} 
                        onClick={() => handleAssignDriver(driver.id)}
                        className="flex items-center p-3 rounded-xl border-2 border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm mr-3 group-hover:scale-105 transition-transform">
                          {driver.avatar ? (
                            <img src={driver.avatar} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-600 text-white font-black text-xs">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{driver.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">DRIVER</p>
                        </div>
                      </button>
                    ))}
                   </div>
                   <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="w-full font-bold text-slate-400 mt-2">
                     {t('common.close')}
                   </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                   <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto font-bold text-slate-400">
                    {t('common.close')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
