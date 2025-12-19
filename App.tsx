
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Product, Order, UserRole, OrderStatus } from './types';
import { db } from './services/db'; 
import { supabase } from './services/supabaseClient';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RestaurantDashboard } from './components/restaurant/RestaurantView';
import { DriverDashboard } from './components/driver/DriverView';
import { Loader2 } from 'lucide-react';
import './i18n'; 
import { useTranslation } from 'react-i18next';

interface AppContextType {
  user: User | null;
  users: User[];
  products: Product[];
  orders: Order[];
  units: string[];
  categories: string[];
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => void;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  toggleProductPromo: (id: string) => Promise<void>;
  bulkProductAction: (ids: string[], updates: Partial<Product>) => Promise<void>;
  addUnit: (unit: string) => Promise<void>;
  updateUnit: (oldUnit: string, newUnit: string) => Promise<void>;
  deleteUnit: (unit: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  createOrder: (items: { product: Product, quantity: number }[], notes?: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, driverId?: string) => Promise<void>;
  updateOrderPricing: (id: string, items: any[]) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  updateUserStatus: (id: string, isActive: boolean) => Promise<void>;
  isDemo: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const allUsers = db.getUsers();
    const allProducts = db.getProducts();
    const allOrders = db.getOrders();
    const allUnits = db.getUnits();
    const allCategories = db.getCategories();
    
    setUsers(allUsers);
    setProducts(allProducts);
    setOrders(allOrders);
    setUnits(allUnits);
    setCategories(allCategories);

    if (!isDemo) {
      try {
        const { data: pData } = await supabase.from('products').select('*');
        if (pData) setProducts(pData as Product[]);
        
        const { data: oData } = await supabase.from('orders').select('*');
        if (oData) setOrders(oData as any);
      } catch (e) {
        console.error("Supabase load error", e);
      }
    }
  }, [isDemo]);

  useEffect(() => {
    const initSession = async () => {
      const savedUser = localStorage.getItem('gds_session');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const verified = db.getUsers().find(u => u.email === parsed.email);
          if (verified) {
            setUser(verified);
            setIsDemo(true);
            setLoading(false);
            refreshData();
            return;
          }
        } catch (e) {
          localStorage.removeItem('gds_session');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          role: (session.user.user_metadata?.role as UserRole) || UserRole.RESTAURANT,
        };
        setUser(mappedUser);
        setIsDemo(false);
      }
      
      setLoading(false);
      refreshData();
    };
    initSession();
  }, [refreshData]);

  const login = async (email: string, password?: string, rememberMe: boolean = false): Promise<boolean> => {
    if (email.includes('@gds.ge') || email.includes('@rest.ge') || email.includes('@driver.ge')) {
      const u = db.login(email, password);
      if (u) {
        setUser(u);
        setIsDemo(true);
        if (rememberMe) {
          localStorage.setItem('gds_session', JSON.stringify({ email: u.email }));
        }
        setTimeout(refreshData, 100);
        return true;
      }
      return false;
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('gds_session');
    setIsDemo(false);
    setUser(null);
    await supabase.auth.signOut();
  };

  const updateUser = async (updatedUser: User) => {
    if (user?.id === updatedUser.id) setUser(updatedUser);
    if (isDemo) {
      db.updateUser(updatedUser);
    } else {
      await supabase.from('users').update({ 
        phone: updatedUser.phone, 
        locationLink: updatedUser.locationLink 
      }).eq('id', updatedUser.id);
    }
    refreshData();
  }

  const addProduct = async (p: Product) => {
    if (isDemo) db.addProduct(p);
    else await supabase.from('products').insert(p);
    refreshData();
  };

  const updateProduct = async (p: Product) => {
    if (isDemo) db.updateProduct(p);
    refreshData();
  };

  const deleteProduct = async (id: string) => {
    if (isDemo) db.deleteProduct(id);
    refreshData();
  };

  const toggleProductStatus = async (id: string) => {
    if (isDemo) db.toggleProductStatus(id);
    refreshData();
  };

  const toggleProductPromo = async (id: string) => {
    if (isDemo) db.toggleProductPromo(id);
    refreshData();
  };

  const bulkProductAction = async (ids: string[], updates: Partial<Product>) => {
    if (isDemo) db.bulkUpdateProducts(ids, updates);
    refreshData();
  };

  const addUnit = async (unit: string) => {
    if (isDemo) db.addUnit(unit);
    refreshData();
  };

  const updateUnit = async (oldUnit: string, newUnit: string) => {
    if (isDemo) db.updateUnit(oldUnit, newUnit);
    refreshData();
  };

  const deleteUnit = async (unit: string) => {
    if (isDemo) db.deleteUnit(unit);
    refreshData();
  };

  const addCategory = async (category: string) => {
    if (isDemo) db.addCategory(category);
    refreshData();
  };

  const updateCategory = async (oldCategory: string, newCategory: string) => {
    if (isDemo) db.updateCategory(oldCategory, newCategory);
    refreshData();
  };

  const deleteCategory = async (category: string) => {
    if (isDemo) db.deleteCategory(category);
    refreshData();
  };

  const addUser = async (u: User) => {
    db.addUser(u);
    refreshData();
  }

  const updateUserStatus = async (id: string, isActive: boolean) => {
    db.updateUserStatus(id, isActive);
    refreshData();
  }

  const createOrder = async (items: { product: Product, quantity: number }[], notes?: string) => {
    if (!user) return;
    if (isDemo) db.createOrder(user, items, notes);
    refreshData();
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, driverId?: string) => {
    if (isDemo) db.updateOrderStatus(id, status, driverId);
    else await supabase.from('orders').update({ status, driver_id: driverId }).eq('id', id);
    refreshData();
  };

  const updateOrderPricing = async (id: string, items: any[]) => {
    if (isDemo) db.updateOrderPricing(id, items);
    refreshData();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      user, users, products, orders, units, categories, isDemo,
      login, logout, refreshData, 
      addProduct, updateProduct, deleteProduct, toggleProductStatus, toggleProductPromo, bulkProductAction, addUnit, updateUnit, deleteUnit,
      addCategory, updateCategory, deleteCategory,
      addUser, updateUser, updateUserStatus,
      createOrder, updateOrderStatus, updateOrderPricing 
    }}>
      {children}
    </AppContext.Provider>
  );
};

const PrivateRoute = ({ children, roles }: { children?: React.ReactNode, roles: UserRole[] }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MainRoutes = () => {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to={`/${user.role.toLowerCase()}`} replace />} />
      <Route path="/admin/*" element={<PrivateRoute roles={[UserRole.ADMIN]}><Layout><AdminDashboard /></Layout></PrivateRoute>} />
      <Route path="/restaurant/*" element={<PrivateRoute roles={[UserRole.RESTAURANT, UserRole.DEMO]}><Layout><RestaurantDashboard /></Layout></PrivateRoute>} />
      <Route path="/driver/*" element={<PrivateRoute roles={[UserRole.DRIVER]}><Layout><DriverDashboard /></Layout></PrivateRoute>} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <MainRoutes />
      </HashRouter>
    </AppProvider>
  );
}
