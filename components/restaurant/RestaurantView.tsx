
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { useApp } from '../../App';
import { Card, Button, Badge, Input, Modal, ProductGridSkeleton } from '../ui/Shared';
import { FilterChips, FilterChip } from '../ui/FilterChips';
import { DateRangePicker, DatePreset } from '../ui/DateRangePicker';
import { Product, OrderStatus, Order } from '../../types';
import { ShoppingCart, Search, Clock, Plus, Minus, MapPin, Phone, Save, AlertCircle, CheckCircle2, Package, MessageSquare, Eye, Filter, Calendar, X, TrendingUp, BarChart3, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight, Edit3, AlertTriangle, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const Catalog = () => {
  const { t, i18n } = useTranslation();
  const { products, createOrder, user, orders, refreshData, isLoadingData } = useApp();
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

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
        const newQty = Math.max(1, item.quantity + delta); // მინიმუმ 1, არ იშლება ავტომატურად
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
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
      // Ensure product is active and matches search and category
      p.isActive !== false &&
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategory === null || p.category === selectedCategory)
    ),
    [products, search, selectedCategory]
  );

  // Separate promo products
  const promoProducts = useMemo(() =>
    products.filter(p => p.isActive !== false && p.isPromo && p.price),
    [products]
  );

  // Get unique categories from active products
  const productCategories = useMemo(() => {
    const cats = new Set(products.filter(p => p.isActive !== false && p.category).map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

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

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mt-4 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === null
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t('restaurant.category_all')}
            </button>
            {productCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Promo Section */}
        {promoProducts.length > 0 && !search && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⭐</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('products.promo_title')}</h3>
              <Badge variant="warning">{t('products.promo')}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promoProducts.map(product => (
                <Card key={product.id} className="flex items-center p-4 space-x-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all group border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform" />
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      აქცია
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{product.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-600 dark:text-amber-400 font-black text-sm">{product.price}₾</span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">/ {product.unit}</span>
                    </div>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none shrink-0" onClick={() => addToCart(product)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Products Section */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{t('products.all_items')}</h3>

        {/* Loading Skeleton */}
        {isLoadingData && products.length === 0 && (
          <ProductGridSkeleton count={8} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isLoadingData && filteredProducts.length > 0 ? filteredProducts.map(product => (
            <Card key={product.id} className={`flex items-center p-4 space-x-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all group ${product.isPromo ? 'border-amber-200 dark:border-amber-800' : ''}`}>
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform" />
                {product.isPromo && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    აქცია
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{product.description}</p>
                )}
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mt-1">
                  {product.unit} • {product.isPromo && product.price ? (
                    <span className="text-amber-600 dark:text-amber-400">{product.price}₾</span>
                  ) : (
                    t('restaurant.price_tbd')
                  )}
                </p>
              </div>
              <Button size="sm" variant={product.isPromo ? "primary" : "outline"} className={product.isPromo ? "bg-amber-500 hover:bg-amber-600 text-white border-none shrink-0" : "border-slate-200 dark:border-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 transition-colors shrink-0"} onClick={() => addToCart(product)}>
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
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 ml-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={t('common.remove')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    // Count-based input - +/- buttons
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
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
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={t('common.remove')}
                      >
                        <X className="h-4 w-4" />
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

      {/* Cart FAB - Mobile Only */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartModalOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all active:scale-95"
          aria-label={t('restaurant.view_cart')}
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
            {cart.reduce((sum, item) => sum + (item.product.unit.toLowerCase() === 'კგ' ? 1 : Math.ceil(item.quantity)), 0)}
          </span>
        </button>
      )}

      {/* Cart Bottom Sheet Modal - Mobile */}
      <Modal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        title={t('restaurant.cart_title')}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-400 dark:text-slate-500 font-bold">{t('restaurant.empty_cart')}</p>
            </div>
          ) : (
            <>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 mr-4 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{item.product.name}</p>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                      {item.product.unit}
                    </p>
                  </div>
                  {isWeightUnit(item.product.unit) ? (
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
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 ml-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
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
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('restaurant.notes')}</span>
                </div>
                <textarea
                  className="w-full h-20 p-3 text-sm border-2 border-slate-100 dark:border-slate-800 bg-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium text-slate-900 dark:text-slate-100"
                  placeholder={t('restaurant.notes_placeholder')}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            className="w-full h-12 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg dark:shadow-none border-none font-bold"
            disabled={cart.length === 0}
            onClick={() => { setIsCartModalOpen(false); handleOpenConfirm(); }}
          >
            {t('restaurant.checkout_btn')}
          </Button>
        </div>
      </Modal>

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
  const { orders, updateOrderStatus, updateOrderItems, user, users, refreshData } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<{ productId: string; productName: string; quantity: number; unit: string }[]>([]);

  // მძღოლის პოვნა ID-ით
  const getDriver = (driverId?: string) => users.find(u => u.id === driverId);

  // შეკვეთის რედაქტირების დაწყება
  const handleStartEdit = (order: Order) => {
    setEditingOrder(order);
    setEditItems(order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit
    })));
  };

  // რაოდენობის შეცვლა
  const handleEditQuantityChange = (productId: string, newQuantity: number) => {
    setEditItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: Math.max(0.1, newQuantity) }
        : item
    ));
  };

  // რედაქტირების შენახვა
  const handleSaveEdit = () => {
    if (editingOrder) {
      const updatedItems = editingOrder.items.map(item => {
        const editItem = editItems.find(e => e.productId === item.productId);
        return editItem ? { ...item, quantity: editItem.quantity } : item;
      });
      updateOrderItems(editingOrder.id, updatedItems);
      setEditingOrder(null);
      setEditItems([]);
    }
  };

  // შემოწმება აქვს თუ არა შეკვეთას კორექციები
  const hasCorrections = (order: Order) => {
    return order.items.some(item => item.originalQuantity !== undefined && item.originalQuantity !== item.quantity);
  };

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
            <Card key={order.id} className={`p-6 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow ${hasCorrections(order) ? 'border-l-4 border-l-orange-500' : ''}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">#{order.id}</h3>
                    <Badge variant={
                      order.status === OrderStatus.COMPLETED ? 'success' :
                      order.status === OrderStatus.PENDING ? 'warning' : 'default'
                    }>
                      {t(`status.${order.status.toLowerCase().replace(/ /g, '_')}` as any)}
                    </Badge>
                    {hasCorrections(order) && (
                      <Badge variant="warning" className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t('orders.corrected')}
                      </Badge>
                    )}
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
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => setViewingOrder(order)} className="flex-1 sm:flex-none">
                    <Eye className="h-4 w-4 mr-2" /> {t('restaurant.details')}
                  </Button>
                  {order.status === OrderStatus.PENDING && (
                    <Button variant="outline" size="sm" onClick={() => handleStartEdit(order)} className="flex-1 sm:flex-none border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                      <Edit3 className="h-4 w-4 mr-2" /> {t('common.edit')}
                    </Button>
                  )}
                  {order.status === OrderStatus.OUT_FOR_DELIVERY && order.driverId && (
                    <Button variant="outline" size="sm" onClick={() => setViewingDriver(order)} className="flex-1 sm:flex-none border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                      <Phone className="h-4 w-4 mr-2" /> {t('restaurant.driver')}
                    </Button>
                  )}
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
                      <tr key={idx} className={item.originalQuantity !== undefined && item.originalQuantity !== item.quantity ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{item.productName}</td>
                        <td className="p-4 text-center">
                          <span className="font-black text-slate-600 dark:text-slate-400">x{item.quantity} {item.unit}</span>
                          {item.originalQuantity !== undefined && item.originalQuantity !== item.quantity && (
                            <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-bold">
                              {t('orders.was')}: {item.originalQuantity} {item.unit}
                            </div>
                          )}
                        </td>
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

      {/* Driver Info Modal */}
      <Modal
        isOpen={!!viewingDriver}
        onClose={() => setViewingDriver(null)}
        title={t('restaurant.driver_info')}
      >
        {viewingDriver && (() => {
          const driver = getDriver(viewingDriver.driverId);
          return driver ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{driver.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('restaurant.driver')}</p>
                </div>
              </div>

              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  {driver.phone}
                </a>
              )}

              {!driver.phone && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-center">
                  <p className="text-sm text-amber-800 dark:text-amber-200">{t('common.no_phone')}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setViewingDriver(null)}>{t('common.close')}</Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500">
              {t('restaurant.driver_not_found')}
            </div>
          );
        })()}
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => { setEditingOrder(null); setEditItems([]); }}
        title={t('orders.modal_edit_title')}
      >
        {editingOrder && (
          <div className="space-y-6">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('orders.edit_warning')}
              </p>
            </div>

            <div className="space-y-3">
              {editItems.map((item) => (
                <div key={item.productId} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{item.unit}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        inputMode="decimal"
                        className="w-20 h-10 text-center font-black"
                        value={item.quantity}
                        onChange={(e) => handleEditQuantityChange(item.productId, parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button variant="outline" onClick={() => { setEditingOrder(null); setEditItems([]); }} className="w-full sm:w-auto">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveEdit} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white border-none">
                {t('orders.save_changes')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Restaurant Analytics Component
const RestaurantAnalytics = () => {
  const { t, i18n } = useTranslation();
  const { orders, user, theme } = useApp();
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month');

  const isDark = theme === 'dark';

  // Filter orders for this restaurant only
  const myOrders = useMemo(() => {
    return orders.filter(o => o.restaurantId === user?.id);
  }, [orders, user?.id]);

  // Filter by time period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (timePeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return myOrders.filter(o => new Date(o.createdAt) >= startDate);
  }, [myOrders, timePeriod]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSpent = filteredOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED).length;
    const pendingOrders = filteredOrders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED).length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Previous period comparison
    const now = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    switch (timePeriod) {
      case 'week':
        prevStartDate.setDate(now.getDate() - 14);
        prevEndDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        prevStartDate.setDate(now.getDate() - 60);
        prevEndDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        prevStartDate.setFullYear(now.getFullYear() - 2);
        prevEndDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const prevOrders = myOrders.filter(o => {
      const date = new Date(o.createdAt);
      return date >= prevStartDate && date < prevEndDate;
    });

    const prevSpent = prevOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const spentChange = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0;
    const ordersChange = prevOrders.length > 0 ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 : 0;

    return {
      totalSpent,
      totalOrders,
      completedOrders,
      pendingOrders,
      avgOrderValue,
      spentChange,
      ordersChange
    };
  }, [filteredOrders, myOrders, timePeriod]);

  // Top ordered products
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; quantity: number; unit: string }> = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, quantity: 0, unit: item.unit };
        }
        productMap[item.productId].quantity += item.quantity;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // Orders trend data
  const ordersTrend = useMemo(() => {
    const days = timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 12;
    const data: { date: string; orders: number; amount: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      if (timePeriod === 'year') {
        date.setMonth(date.getMonth() - i);
      } else {
        date.setDate(date.getDate() - i);
      }

      const dateStr = timePeriod === 'year'
        ? date.toLocaleDateString('ka-GE', { month: 'short' })
        : date.toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit' });

      const dayOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (timePeriod === 'year') {
          return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
        }
        return orderDate.toDateString() === date.toDateString();
      });

      data.push({
        date: dateStr,
        orders: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0)
      });
    }

    return data;
  }, [filteredOrders, timePeriod]);

  // Order status distribution
  const statusData = useMemo(() => {
    const statusCounts = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.OUT_FOR_DELIVERY]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.COMPLETED]: 0
    };

    filteredOrders.forEach(o => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    return [
      { name: t('status.pending'), value: statusCounts[OrderStatus.PENDING], color: '#f59e0b' },
      { name: t('status.confirmed'), value: statusCounts[OrderStatus.CONFIRMED], color: '#3b82f6' },
      { name: t('status.out_for_delivery'), value: statusCounts[OrderStatus.OUT_FOR_DELIVERY], color: '#8b5cf6' },
      { name: t('status.delivered'), value: statusCounts[OrderStatus.DELIVERED], color: '#10b981' },
      { name: t('status.completed'), value: statusCounts[OrderStatus.COMPLETED], color: '#059669' }
    ].filter(d => d.value > 0);
  }, [filteredOrders, t]);

  const StatCard = ({ title, value, icon: Icon, color, change, suffix = '' }: { title: string; value: string | number; icon: LucideIcon; color: string; change?: number; suffix?: string }) => (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{value}{suffix}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% {t('analytics.vs_previous')}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('nav.analytics')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('restaurantAnalytics.subtitle')}</p>
        </div>

        {/* Time Period Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['week', 'month', 'year'] as const).map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                timePeriod === period
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t(`analytics.period_${period}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('restaurantAnalytics.totalSpent')}
          value={`₾${metrics.totalSpent.toFixed(0)}`}
          icon={DollarSign}
          color="bg-emerald-500"
          change={metrics.spentChange}
        />
        <StatCard
          title={t('restaurantAnalytics.totalOrders')}
          value={metrics.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-500"
          change={metrics.ordersChange}
        />
        <StatCard
          title={t('restaurantAnalytics.avgOrder')}
          value={`₾${metrics.avgOrderValue.toFixed(0)}`}
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title={t('restaurantAnalytics.pendingOrders')}
          value={metrics.pendingOrders}
          icon={Clock}
          color="bg-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Trend Chart */}
        <Card className="p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {t('restaurantAnalytics.spendingTrend')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersTrend}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₾${value.toFixed(2)}`, t('restaurantAnalytics.amount')]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Order Status Distribution */}
        <Card className="p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            {t('analytics.order_status')}
          </h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                {t('restaurantAnalytics.noData')}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Package className="h-4 w-4 text-purple-500" />
          {t('restaurantAnalytics.topProducts')}
        </h3>
        {topProducts.length > 0 ? (
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500 dark:text-slate-400">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{product.name}</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      style={{ width: `${(product.quantity / topProducts[0].quantity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500">
            {t('restaurantAnalytics.noData')}
          </div>
        )}
      </Card>
    </div>
  );
};

const Settings = () => {
  const { t } = useTranslation();
  const { user, updateUser, showToast } = useApp();
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    locationLink: user?.locationLink || '',
    address: user?.address || '',
    workingHours: user?.workingHours || '',
    preferredDeliveryTime: user?.preferredDeliveryTime || 'any',
    defaultDriverNote: user?.defaultDriverNote || '',
    paymentMethod: user?.paymentMethod || 'cash'
  });
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateUser({ ...user, ...formData });
    setSaving(false);
    showToast(t('settings.saved_success'), 'success');
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      showToast(t('settings.password_mismatch'), 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast(t('settings.password_too_short'), 'error');
      return;
    }
    // TODO: Implement actual password change via Supabase Auth
    showToast(t('settings.password_changed'), 'success');
    setShowPasswordModal(false);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('restaurant.settings_title')}</h2>

      {/* Contact Information */}
      <Card className="p-6 shadow-lg dark:shadow-none border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Phone className="h-4 w-4" /> {t('settings.contact_info')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('users.phone')}</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="555-00-00-00"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.address')}</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder={t('settings.address_placeholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('restaurant.location_label')}</label>
            <Input
              value={formData.locationLink}
              onChange={(e) => setFormData({...formData, locationLink: e.target.value})}
              placeholder="https://maps.app.goo.gl/..."
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">{t('restaurant.location_help')}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.working_hours')}</label>
            <Input
              value={formData.workingHours}
              onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
              placeholder={t('settings.working_hours_placeholder')}
            />
          </div>
        </div>
      </Card>

      {/* Delivery Preferences */}
      <Card className="p-6 shadow-lg dark:shadow-none border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Clock className="h-4 w-4" /> {t('settings.delivery_preferences')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.preferred_time')}</label>
            <select
              value={formData.preferredDeliveryTime}
              onChange={(e) => setFormData({...formData, preferredDeliveryTime: e.target.value as any})}
              className="w-full h-11 px-4 rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="any">{t('settings.time_any')}</option>
              <option value="morning">{t('settings.time_morning')}</option>
              <option value="afternoon">{t('settings.time_afternoon')}</option>
              <option value="evening">{t('settings.time_evening')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.default_driver_note')}</label>
            <textarea
              value={formData.defaultDriverNote}
              onChange={(e) => setFormData({...formData, defaultDriverNote: e.target.value})}
              placeholder={t('settings.driver_note_placeholder')}
              className="w-full h-24 p-3 text-sm border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">{t('settings.driver_note_help')}</p>
          </div>
        </div>
      </Card>

      {/* Payment */}
      <Card className="p-6 shadow-lg dark:shadow-none border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {t('settings.payment')}
        </h3>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{t('settings.payment_method')}</label>
          <div className="flex flex-wrap gap-3">
            {['cash', 'transfer', 'both'].map((method) => (
              <button
                key={method}
                onClick={() => setFormData({...formData, paymentMethod: method as any})}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  formData.paymentMethod === method
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t(`settings.payment_${method}`)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6 shadow-lg dark:shadow-none border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Save className="h-4 w-4" /> {t('settings.security')}
        </h3>
        <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
          {t('settings.change_password')}
        </Button>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="h-12 px-10 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none shadow-lg dark:shadow-none">
          {saving ? t('common.loading') : t('common.save')}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Password Change Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title={t('settings.change_password')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.current_password')}</label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({...passwords, current: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.new_password')}</label>
            <Input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t('settings.confirm_password')}</label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handlePasswordChange}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const RestaurantDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/history" element={<History />} />
      <Route path="/analytics" element={<RestaurantAnalytics />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};
