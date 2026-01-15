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
  addUnit: (unit: string) => Promise<void>;
  updateUnit: (oldUnit: string, newUnit: string) => Promise<void>;
  deleteUnit: (unit: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
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
  const { t } = useTranslation();
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
    // Access environment variables via process.env or window.env (runtime injection)
    // Support both VITE_* and NEXT_PUBLIC_* prefixes for compatibility
    const getEnv = (key: string) => {
      const viteKey = `VITE_${key}`;
      const nextKey = `NEXT_PUBLIC_${key}`;
      return (window as any).env?.[viteKey] || (window as any).env?.[nextKey] || 
             import.meta.env?.[viteKey] || import.meta.env?.[nextKey];
    };

    const envUrl = getEnv('SUPABASE_URL');
    const envKey = getEnv('SUPABASE_ANON_KEY');
    const envCompany = getEnv('COMPANY_NAME');

    if (envUrl && envKey) {
      const envConfig: AppConfig = {
        supabaseUrl: envUrl,
        supabaseKey: envKey,
        companyName: envCompany || 'GDS Greenland',
        setupComplete: true
      };
      setConfig(envConfig);
      initSupabase(envConfig.supabaseUrl, envConfig.supabaseKey);
    } else {
      const savedConfig = localStorage.getItem('gds_system_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        initSupabase(parsed.supabaseUrl, parsed.supabaseKey);
      }
    }
    setLoading(false);
  }, []);

  const saveConfig = (cfg: AppConfig) => {
    localStorage.setItem('gds_system_config', JSON.stringify(cfg));
    setConfig(cfg);
    initSupabase(cfg.supabaseUrl, cfg.supabaseKey);
    // Remove reload to prevent loop, state update will trigger navigation
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
    
    // Always load local mock data for fallback or initial state if needed, but prioritize Supabase
    // If we are in DEMO mode, we might want to show Supabase products but keep local orders?
    // User requirement: "Demo for restaurant must see REAL products"
    
    if (isDemo) {
        // For Demo user:
        // 1. Get Products from Supabase (Real data)
        // 2. Keep Orders local (Mock)
        // 3. User is Mock
        if (supabase) {
            const { data: realProducts } = await supabase.from('products').select('*');
            if (realProducts) setProducts(realProducts as Product[]);
            else setProducts(db.getProducts()); // Fallback
            
            const { data: realCategories } = await supabase.from('categories').select('*'); // If you have categories table
            // If not using tables for units/categories yet, fallback to hardcoded or fetch distinct
            setCategories(db.getCategories()); 
            setUnits(db.getUnits());
        } else {
             setProducts(db.getProducts());
        }
        setOrders([]); // Demo user starts with empty orders or mock orders
        setUsers(db.getUsers()); // Demo user only sees itself?
        return;
    }

    if (supabase && user) {
      try {
        const [pRes, oRes, uRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('orders').select('*').order('createdAt', { ascending: false }),
          supabase.from('users').select('*')
        ]);
        
        if (pRes.data) setProducts(pRes.data as Product[]);
        if (oRes.data) setOrders(oRes.data as any);
        if (uRes.data) setUsers(uRes.data as User[]);
        
        // Load units/categories if they exist in DB, otherwise use defaults
        // For now using DB defaults as they might not be in Supabase yet
        setUnits(db.getUnits());
        setCategories(db.getCategories());
        
      } catch (e) {
        console.warn("Supabase sync failed");
      }
    }
  }, [isDemo, user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, isDemo, refreshData]);

  const login = async (email: string, password?: string, rememberMe: boolean = false): Promise<boolean> => {
    // Check for demo login specifically
    if (email === 'demo@gds.ge') {
       const u = db.login(email, password);
       if (u) {
         setIsDemo(true);
         setUser(u);
         return true;
       }
    }

    const supabase = getSupabase();
    
    if (supabase) {
      try {
        const { data } = await supabase.auth.signInWithPassword({ email, password: password || '' });
        if (data.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
          // If no profile exists, create a basic one based on auth data (or handle error)
          const mappedUser: User = profile || { 
            id: data.user.id, 
            email: data.user.email || '', 
            name: 'User', 
            role: UserRole.RESTAURANT, // Default role
            isActive: true 
          };
          setUser(mappedUser);
          setIsDemo(false);
          if (rememberMe) localStorage.setItem('gds_session', JSON.stringify({ email: mappedUser.email }));
          return true;
        }
      } catch (e) {
        console.error("Login failed:", e);
      }
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('gds_session');
    setUser(null);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  };

  const addProduct = async (p: Product) => { if (isDemo) db.addProduct(p); else await getSupabase()?.from('products').insert(p); refreshData(); };
  const updateProduct = async (p: Product) => { if (isDemo) db.updateProduct(p); else await getSupabase()?.from('products').update(p).eq('id', p.id); refreshData(); };
  const deleteProduct = async (id: string) => { if (isDemo) db.deleteProduct(id); else await getSupabase()?.from('products').delete().eq('id', id); refreshData(); };
  const toggleProductStatus = async (id: string) => { if (isDemo) db.toggleProductStatus(id); refreshData(); };
  const toggleProductPromo = async (id: string) => { if (isDemo) db.toggleProductPromo(id); refreshData(); };
  const bulkProductAction = async (ids: string[], updates: any) => { if (isDemo) db.bulkUpdateProducts(ids, updates); refreshData(); };
  
  const addUnit = async (unit: string) => { if (isDemo) db.addUnit(unit); refreshData(); };
  const updateUnit = async (oldUnit: string, newUnit: string) => { if (isDemo) db.updateUnit(oldUnit, newUnit); refreshData(); };
  const deleteUnit = async (unit: string) => { if (isDemo) db.deleteUnit(unit); refreshData(); };
  
  const addCategory = async (category: string) => { if (isDemo) db.addCategory(category); refreshData(); };
  const updateCategory = async (oldCategory: string, newCategory: string) => { if (isDemo) db.updateCategory(oldCategory, newCategory); refreshData(); };
  const deleteCategory = async (category: string) => { if (isDemo) db.deleteCategory(category); refreshData(); };

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
      addUnit, updateUnit, deleteUnit, addCategory, updateCategory, deleteCategory,
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

const PrivateRoute = ({ children, roles }: { children?: React.ReactNode, roles: UserRole[] }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};