
import React, { useState, useMemo } from 'react';
import { useApp } from '../../App';
import { Button, Input, Card, Badge, Modal } from '../ui/Shared';
import { OrderStatus, Order, UserRole, OrderItem } from '../../types';
import { Check, Truck, Eye, DollarSign, ShoppingBag, Wallet, AlertTriangle, MessageSquare, Clock } from 'lucide-react';
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
      return true;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter]);

  const handleOpenOrder = (order: Order, mode: 'view' | 'pricing') => {
    setSelectedOrder(order);
    setPricingMode(mode === 'pricing');
    if (mode === 'pricing') {
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
          <Badge variant="outline">{shoppingList.length} {t('common.items')}</Badge>
        </div>
        {shoppingList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shoppingList.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</div>
                <div className="text-blue-600 dark:text-blue-400 font-black text-lg mt-1">{item.quantity} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">{item.unit}</span></div>
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col md:flex-row gap-5 items-center">
            <select 
                className="flex h-11 w-full md:w-56 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="All">{t('orders.all_statuses')}</option>
                {Object.values(OrderStatus).map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
            </select>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 dark:shadow-none rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{t('orders.table_id_restaurant')}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{t('orders.table_status')}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{t('orders.table_financials')}</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{t('orders.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => {
                const assignedDriver = users.find(u => u.id === order.driverId);
                const needsPricing = order.status === OrderStatus.CONFIRMED && (!order.totalCost || order.totalCost === 0);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{order.restaurantName}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">#{order.id}</div>
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
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                            <Truck className="h-3 w-3" />
                            {assignedDriver.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {needsPricing ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {i18n.language === 'ka' ? 'ფასები შესაყვანია' : 'Pricing Required'}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-slate-100">
                            <Wallet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            {order.totalCost ? `$${order.totalCost.toFixed(2)}` : 'TBD'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {order.status === OrderStatus.PENDING && (
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, OrderStatus.CONFIRMED)} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                          <Check className="h-3 w-3 mr-1" /> {t('common.confirm')}
                        </Button>
                      )}
                      {order.status === OrderStatus.CONFIRMED && (
                        <Button size="sm" variant={needsPricing ? "primary" : "secondary"} onClick={() => handleOpenOrder(order, 'pricing')}>
                          <DollarSign className="h-3 w-3 mr-1" /> {t('common.price')}
                        </Button>
                      )}
                      {(order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.OUT_FOR_DELIVERY) && (
                         <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none" onClick={() => handleOpenOrder(order, 'view')}>
                          <Truck className="h-3 w-3 mr-1" /> {t('common.assign')}
                         </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleOpenOrder(order, 'view')} className="text-slate-400 dark:text-slate-500">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
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
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
               <table className="min-w-full text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-800">
                   <tr>
                     <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_product')}</th>
                     <th className="p-4 text-center font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('orders.table_qty')}</th>
                     {pricingMode && (
                       <>
                         <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{i18n.language === 'ka' ? 'თვითღირ.' : 'Cost'}</th>
                         <th className="p-4 text-left font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{i18n.language === 'ka' ? 'გასაყიდი' : 'Sell'}</th>
                       </>
                     )}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {(pricingMode ? priceEdits : selectedOrder.items).map((item, idx) => (
                     <tr key={idx}>
                       <td className="p-4">
                         <div className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</div>
                         <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{item.unit}</div>
                       </td>
                       <td className="p-4 text-center font-black text-slate-600 dark:text-slate-400">x{item.quantity}</td>
                       {pricingMode && (
                         <>
                           <td className="p-4">
                             <Input 
                               type="number" step="0.1" className="w-20 h-9 p-2" 
                               value={item.costPrice || ''} 
                               onChange={(e) => handlePriceChange(idx, 'costPrice', e.target.value)} 
                             />
                           </td>
                           <td className="p-4">
                             <Input 
                               type="number" step="0.1" className="w-20 h-9 p-2 border-emerald-200 dark:border-emerald-900" 
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

            {pricingMode ? (
              <div className="pt-4 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setSelectedOrder(null)}>{t('common.cancel')}</Button>
                 <Button onClick={savePricing} className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-8 border-none">{t('orders.save_pricing')}</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Driver Assignment Grid */}
                {selectedOrder.status === OrderStatus.CONFIRMED && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('orders.assign_driver')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {drivers.map(driver => (
                        <button 
                          key={driver.id} 
                          onClick={() => handleAssignDriver(driver.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            selectedOrder.driverId === driver.id 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                           <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-black">
                             {driver.name.charAt(0)}
                           </div>
                           <span className="text-sm font-bold truncate dark:text-slate-200">{driver.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                   <Button variant="secondary" onClick={() => setSelectedOrder(null)}>{t('common.close')}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
