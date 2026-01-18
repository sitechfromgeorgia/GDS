
import React, { useState } from 'react';
import { useApp } from '../../App';
import { Card, Button, Badge } from '../ui/Shared';
import { MapPin, Phone, CheckCircle, Navigation, Clock, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { OrderStatus } from '../../types';
import { useTranslation } from 'react-i18next';

export const DriverDashboard = () => {
  const { t } = useTranslation();
  const { orders, updateOrderStatus, user, users } = useApp();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const myDeliveries = orders.filter(o => o.driverId === user?.id && o.status === OrderStatus.OUT_FOR_DELIVERY);
  const history = orders.filter(o => o.driverId === user?.id && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED));

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleNavigation = (link?: string) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('driver.current_trip')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{myDeliveries.length} {t('driver.active_orders')}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          LIVE
        </div>
      </div>

      <div className="space-y-5">
        {myDeliveries.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 dark:text-slate-600 bg-white/50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-800">
            <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="h-10 w-10 text-slate-300 dark:text-slate-700" />
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-400">{t('driver.all_delivered')}</p>
            <p className="text-sm mt-1">{t('driver.new_trips_appear')}</p>
          </Card>
        ) : (
          myDeliveries.map(order => {
            const restaurant = users.find(u => u.id === order.restaurantId);
            
            return (
              <Card key={order.id} className="border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-lg dark:shadow-none overflow-hidden transition-colors">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">{order.restaurantName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-1 uppercase tracking-tight">ID: {order.id}</p>
                    </div>
                    <Badge variant="warning" className="px-3 py-1">{t('driver.on_the_way')}</Badge>
                  </div>
                  
                  <div className="space-y-3 mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{t('driver.location')}</p>
                         <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                           {restaurant?.locationLink ? t('driver.maps_location') : t('driver.no_address')}
                         </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{t('driver.contact')}</p>
                         <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{restaurant?.phone || t('driver.no_phone')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Products Section */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleOrderExpanded(order.id)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {t('driver.products')}
                          </span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {order.items.length}
                          </span>
                        </div>
                        {expandedOrders.has(order.id) ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      {expandedOrders.has(order.id) && (
                        <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0"
                            >
                              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate flex-1 pr-3">
                                {item.productName}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm tabular-nums">
                                  {item.quantity}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {item.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button 
                      variant="outline" 
                      className={`w-full flex items-center justify-center py-7 rounded-xl border-blue-200 dark:border-blue-900/50 ${restaurant?.locationLink ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10 text-blue-700 dark:text-blue-400' : 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'}`}
                      disabled={!restaurant?.locationLink}
                      onClick={() => handleNavigation(restaurant?.locationLink)}
                    >
                      <Navigation className="h-5 w-5 mr-2" /> 
                      <span className="font-bold">{t('driver.navigation')}</span>
                    </Button>
                    
                    <a href={restaurant?.phone ? `tel:${restaurant.phone}` : '#'} className="block w-full">
                       <Button 
                         variant="outline" 
                         className={`w-full flex items-center justify-center py-7 rounded-xl border-emerald-200 dark:border-emerald-900/50 ${restaurant?.phone ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'}`}
                         disabled={!restaurant?.phone}
                       >
                          <Phone className="h-5 w-5 mr-2" /> 
                          <span className="font-bold">{t('driver.call')}</span>
                       </Button>
                    </a>
                  </div>
                  
                  <Button 
                    className="w-full py-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-none font-bold text-lg rounded-xl shadow-xl dark:shadow-none flex items-center justify-center gap-3 transition-colors"
                    onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                  >
                    <CheckCircle className="h-6 w-6 text-emerald-400 dark:text-emerald-600" />
                    {t('driver.delivered')}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {history.length > 0 && (
        <div className="pt-8 px-2 pb-10">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center text-sm uppercase tracking-widest opacity-60">
            <Clock className="h-4 w-4 mr-2" /> {t('driver.today_history')}
          </h3>
          <div className="space-y-3">
            {history.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm opacity-80">
                 <div>
                   <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{order.restaurantName}</p>
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('driver.delivered_at')}: {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                 </div>
                 <Badge variant="success">OK</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
