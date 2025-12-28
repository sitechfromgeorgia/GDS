
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Product, Order, UserRole, OrderStatus, Toast as ToastType } from './types';
import { db } from './services/db'; 
import { initSupabase, getSupabase } from './services/supabaseClient';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RestaurantDashboard } from './components/restaurant/RestaurantView';
import { DriverDashboard } from './components/driver/DriverView';
import { SetupPage } from './components/SetupPage';
import { Toast } from './components/ui/Shared';
import { Loader2 } from 'lucide-react';
import './i18n'; 
import { useTranslation } from 'react-i18next';

interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  companyName: string;
  aiApiKey?: string;
  setupComplete: boolean;
}

interface AppContextType {
  user: User | null;
  users: User[];
  products: Product[];
  orders: Order[];
  units: string[];
  categories: string[];
  theme: 'light' | 'dark';
  config: AppConfig | null;
  toggleTheme: () => void;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => void;
  saveConfig: (cfg: AppConfig) => void;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  toggleProductPromo: (id: string) => Promise<void>;
  bulkProductAction: (ids: string[], updates: Partial<Product>) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  updateUserStatus: (id: string, isActive: boolean) => Promise<void>;
  createOrder: (items: { product: Product, quantity: number }[], notes?: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, driverId?: string) => Promise<void>;
  updateOrderPricing: (id: string, items: any[]) => Promise<void>;
  showToast: (message: string, type?: ToastType['type']) => void;
  isDemo: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('gds_theme') as any) || 'light');
  
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const savedConfig = localStorage.getItem('gds_system_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      initSupabase(parsed.supabaseUrl, parsed.supabaseKey);
    }
    setLoading(false);
  }, []);

  const saveConfig = (cfg: AppConfig) => {
    localStorage.setItem('gds_system_config', JSON.stringify(cfg));
    setConfig(cfg);
    initSupabase(cfg.supabaseUrl, cfg.supabaseKey);
    window.location.reload(); // Reload to re-init everything
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('gds_theme', next);
      return next;
    });
  };

  const showToast = useCallback((message: string, type: ToastType['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const refreshData = useCallback(async () => {
    const supabase = getSupabase();
    setUsers(db.getUsers());
    setProducts(db.getProducts());
    setOrders(db.getOrders());
    setUnits(db.getUnits());
    setCategories(db.getCategories());

    if (supabase && !isDemo && user) {
      try {
        const [pRes, oRes, uRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('orders').select('*').order('createdAt', { ascending: false }),
          supabase.from('users').select('*')
        ]);
        if (pRes.data) setProducts(pRes.data as Product[]);
        if (oRes.data) setOrders(oRes.data as any);
        if (uRes.data) setUsers(uRes.data as User[]);
      } catch (e) {
        console.warn("Supabase sync failed");
      }
    }
  }, [isDemo, user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, isDemo, refreshData]);

  const login = async (email: string, password?: string, rememberMe: boolean = false): Promise<boolean> => {
    const isMock = email.includes('@gds.ge') || email.includes('@rest.ge') || email.includes('@driver.ge');
    const supabase = getSupabase();
    
    if (isMock) {
      const u = db.login(email, password);
      if (u) {
        setIsDemo(u.role === UserRole.DEMO || email.includes('demo'));
        setUser(u);
        if (rememberMe) localStorage.setItem('gds_session', JSON.stringify({ email: u.email }));
        return true;
      }
    } else if (supabase) {
      try {
        const { data } = await supabase.auth.signInWithPassword({ email, password: password || '' });
        if (data.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
          const mappedUser: User = profile || { id: data.user.id, email: data.user.email || '', name: 'User', role: UserRole.RESTAURANT };
          setUser(mappedUser);
          setIsDemo(false);
          return true;
        }
      } catch (e) {}
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('gds_session');
    setUser(null);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  };

  // Basic CRUD shells (Real logic uses refreshData)
  const addProduct = async (p: Product) => { if (isDemo) db.addProduct(p); else await getSupabase()?.from('products').insert(p); refreshData(); };
  const updateProduct = async (p: Product) => { if (isDemo) db.updateProduct(p); else await getSupabase()?.from('products').update(p).eq('id', p.id); refreshData(); };
  const deleteProduct = async (id: string) => { if (isDemo) db.deleteProduct(id); else await getSupabase()?.from('products').delete().eq('id', id); refreshData(); };
  const toggleProductStatus = async (id: string) => { if (isDemo) db.toggleProductStatus(id); refreshData(); };
  const toggleProductPromo = async (id: string) => { if (isDemo) db.toggleProductPromo(id); refreshData(); };
  const bulkProductAction = async (ids: string[], updates: any) => { if (isDemo) db.bulkUpdateProducts(ids, updates); refreshData(); };
  const addUser = async (u: User) => { db.addUser(u); refreshData(); };
  const updateUser = async (u: User) => { db.updateUser(u); if(user?.id === u.id) setUser(u); refreshData(); };
  const updateUserStatus = async (id: string, active: boolean) => { db.updateUserStatus(id, active); refreshData(); };
  const createOrder = async (items: any[], notes?: string) => { if(user) db.createOrder(user, items, notes); refreshData(); };
  const updateOrderStatus = async (id: string, status: any, driver?: string) => { db.updateOrderStatus(id, status, driver); refreshData(); };
  const updateOrderPricing = async (id: string, items: any) => { db.updateOrderPricing(id, items); refreshData(); };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppContext.Provider value={{ 
      user, users, products, orders, units, categories, theme, config, isDemo,
      toggleTheme, login, logout, refreshData, saveConfig,
      addProduct, updateProduct, deleteProduct, toggleProductStatus, toggleProductPromo, bulkProductAction,
      addUser, updateUser, updateUserStatus, createOrder, updateOrderStatus, updateOrderPricing, showToast
    }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
      </div>
    </AppContext.Provider>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/*" element={<AppLoader />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

const AppLoader = () => {
  const { config, user } = useApp();
  if (!config?.setupComplete) return <Navigate to="/setup" replace />;
  
  const getHomeRedirect = () => {
    if (!user) return <LandingPage />;
    if (user.role === UserRole.DEMO) return <Navigate to="/restaurant" replace />;
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  };

  return (
    <Routes>
      <Route path="/" element={getHomeRedirect()} />
      <Route path="/admin/*" element={<PrivateRoute roles={[UserRole.ADMIN]}><Layout><AdminDashboard /></Layout></PrivateRoute>} />
      <Route path="/restaurant/*" element={<PrivateRoute roles={[UserRole.RESTAURANT, UserRole.DEMO]}><Layout><RestaurantDashboard /></Layout></PrivateRoute>} />
      <Route path="/driver/*" element={<PrivateRoute roles={[UserRole.DRIVER]}><Layout><DriverDashboard /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Fix: Making children optional to resolve TypeScript error where the compiler thinks 'children' is missing when used inside a prop expression.
const PrivateRoute = ({ children, roles }: { children?: React.ReactNode, roles: UserRole[] }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
