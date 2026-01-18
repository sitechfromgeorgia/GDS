
import React from 'react';
import { useApp } from '../App';
import { UserRole } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher, ThemeToggle } from './ui/Shared';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  LogOut, 
  Menu,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, config } = useApp();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const getNavItems = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/admin' },
          { label: t('nav.orders'), icon: ShoppingCart, path: '/admin/orders' },
          { label: t('nav.products'), icon: Package, path: '/admin/products' },
          { label: t('nav.users'), icon: Users, path: '/admin/users' },
          { label: t('nav.analytics'), icon: TrendingUp, path: '/admin/analytics' },
        ];
      case UserRole.RESTAURANT:
      case UserRole.DEMO:
        return [
          { label: t('nav.orders'), icon: ShoppingCart, path: '/restaurant' },
          { label: t('nav.history'), icon: Package, path: '/restaurant/history' },
          { label: t('nav.analytics'), icon: TrendingUp, path: '/restaurant/analytics' },
          { label: t('nav.settings'), icon: Settings, path: '/restaurant/settings' },
        ];
      case UserRole.DRIVER:
        return [
          { label: t('nav.deliveries'), icon: Truck, path: '/driver' },
        ];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-georgian transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-10 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-950 dark:bg-white p-2 rounded-lg">
               <Truck className="h-5 w-5 text-white dark:text-slate-950" />
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-950 dark:text-white">{config?.companyName || 'GDS'}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {getNavItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                  isActive 
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-lg' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between px-2">
             <LanguageSwitcher />
             <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-3 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm font-bold"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-slate-950 dark:bg-white p-1.5 rounded-lg">
            <Truck className="h-5 w-5 text-white dark:text-slate-950" />
          </div>
          <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{config?.companyName || 'GDS'}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-400">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
           <div className="bg-white dark:bg-slate-900 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
              <nav className="flex flex-col p-6 space-y-2">
                <div className="pb-6 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">მომხმარებელი</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                </div>
                {getNavItems().map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 font-bold mt-4"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </nav>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
