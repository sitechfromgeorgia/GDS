
import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useApp } from '../../App';
import { Card, Button, Badge, Input, Modal } from '../ui/Shared';
import { Product } from '../../types';
import { ShoppingCart, Search, Clock, Plus, Minus, MapPin, Phone, Save, AlertCircle, CheckCircle2, Star, Package, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Catalog = () => {
  const { t, i18n } = useTranslation();
  const { products, createOrder, user, orders } = useApp();
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const activeOrder = orders.find(o => o.restaurantId === user?.id && o.status !== 'Completed');

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

  const promoProducts = useMemo(() => 
    products.filter(p => p.isActive && p.isPromo && p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const regularProducts = useMemo(() => 
    products.filter(p => p.isActive && !p.isPromo && p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        
        {/* Active Order Banner */}
        {activeOrder && !submitted && (
           <div className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-3">
               <div className="bg-amber-100 p-2 rounded-lg">
                 <Clock className="h-5 w-5 text-amber-600" />
               </div>
               <div>
                 <p className="text-sm font-bold text-amber-900">{t('restaurant.active_order_title')}</p>
                 <p className="text-[11px] text-amber-700 font-medium">
                   {t('restaurant.active_order_desc', { id: activeOrder.id, status: activeOrder.status })}
                 </p>
               </div>
             </div>
             <Badge variant="warning">{activeOrder.status}</Badge>
           </div>
        )}

        <div className="mb-6 sticky top-0 bg-slate-50 pt-2 pb-4 z-10">
          <h2 className="text-2xl font-bold mb-4">{t('nav.products')}</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder={t('common.search')} 
              className="pl-12 h-12 shadow-md border-none" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Promo Section */}
        {promoProducts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">{t('products.promo_title')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promoProducts.map(product => (
                <Card key={product.id} className="flex items-center p-4 space-x-4 border-amber-200 bg-amber-50/30 hover:shadow-md transition-all">
                  <img src={product.image} alt={product.name} className="w-20 h-20 rounded-xl object-cover bg-white shadow-sm border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{product.unit}</p>
                    <div className="mt-2 flex items-center gap-2">
                       {product.price && (
                         <span className="text-emerald-700 font-black text-lg">${product.price.toFixed(2)}</span>
                       )}
                       <Badge variant="warning" className="text-[9px]">{t('products.promo')}</Badge>
                    </div>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 shadow-sm shrink-0" onClick={() => addToCart(product)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-sm font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">{t('products.all_items')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regularProducts.length > 0 ? regularProducts.map(product => (
            <Card key={product.id} className="flex items-center p-4 space-x-4 hover:border-slate-300 transition-all group">
              <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{product.unit}</p>
              </div>
              <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-900 hover:text-white transition-colors shrink-0" onClick={() => addToCart(product)}>
                <Plus className="h-4 w-4" />
              </Button>
            </Card>
          )) : (
            <div className="col-span-full py-10 text-center text-slate-400 italic">
               {t('orders.no_orders_found')}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-lg flex items-center text-slate-900">
            <ShoppingCart className="mr-3 h-5 w-5 text-emerald-600" /> {t('restaurant.cart_title')}
          </h3>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {cart.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Package className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold">{t('restaurant.empty_cart')}</p>
            </div>
          ) : (
            <>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1 mr-4 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] font-black text-slate-400 uppercase mt-0.5">
                      {item.product.unit} {item.product.isPromo && item.product.price ? `• $${item.product.price.toFixed(2)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden shrink-0">
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm font-bold text-slate-900 min-w-[32px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{i18n.language === 'ka' ? 'შენიშვნა' : 'Notes'}</span>
                </div>
                <textarea 
                  className="w-full h-24 p-3 text-sm border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-300 font-medium"
                  placeholder={i18n.language === 'ka' ? 'მაგ. დატოვეთ ჭიშკართან...' : 'e.g. Leave at the gate...'}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
           <Button 
             className="w-full h-14 bg-slate-950 shadow-lg shadow-slate-200 text-base font-bold" 
             disabled={cart.length === 0 || !!activeOrder} 
             onClick={handleOpenConfirm}
           >
             {activeOrder ? t('restaurant.active_order_title') : t('restaurant.checkout_btn')}
           </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)} 
        title={t('restaurant.confirm_title')}
      >
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
            <p className="text-sm text-emerald-800 font-medium leading-relaxed">
              {t('restaurant.confirm_desc')}
            </p>
          </div>

          <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <img src={item.product.image} alt="" className="h-10 w-10 rounded-lg object-cover bg-white" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {item.product.unit} {item.product.isPromo && item.product.price ? `• $${item.product.price.toFixed(2)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-lg font-black text-slate-900">
                  x {item.quantity}
                </div>
              </div>
            ))}
          </div>

          {orderNotes && (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{i18n.language === 'ka' ? 'დამატებითი შენიშვნა' : 'Additional Notes'}</span>
               </div>
               <p className="text-xs text-slate-600 italic leading-relaxed">{orderNotes}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsConfirmModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100" onClick={handleSubmit}>
              {t('common.submit')}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const History = () => {
  const { t } = useTranslation();
  const { orders, updateOrderStatus, user } = useApp();
  const myOrders = orders.filter(o => o.restaurantId === user?.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900">{t('nav.history')}</h2>
      <div className="space-y-4">
        {myOrders.length === 0 ? (
          <Card className="p-16 text-center text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold">{t('restaurant.empty_history')}</p>
          </Card>
        ) : (
          myOrders.map(order => (
            <Card key={order.id} className="p-6 border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-lg text-slate-900">#{order.id}</h3>
                    <Badge variant={order.status === 'Completed' ? 'success' : 'default'}>{order.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tight">{order.items.length} {t('common.items')}</p>
                </div>
                {order.status === 'Delivered' && (
                  <Button onClick={() => updateOrderStatus(order.id, 'Completed' as any)} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto shadow-lg shadow-emerald-50">
                    {t('restaurant.confirm_receive')}
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
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
      <h2 className="text-3xl font-bold text-slate-900">{t('restaurant.settings_title')}</h2>
      <Card className="p-8 space-y-6 shadow-xl border-slate-100">
        <div>
          <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{t('users.phone')}</label>
          <div className="relative">
            <Input 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              placeholder="555-00-00-00" 
              className="pl-12"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{t('restaurant.location_label')}</label>
          <div className="relative">
            <Input 
              value={formData.locationLink} 
              onChange={(e) => setFormData({...formData, locationLink: e.target.value})} 
              placeholder="https://maps.app.goo.gl/..." 
              className="pl-12"
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium italic">{t('restaurant.location_help')}</p>
        </div>

        <div className="pt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="h-12 px-10 bg-slate-900 shadow-lg shadow-slate-200">
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
