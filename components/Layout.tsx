
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
  Settings,
  Mail,
  Phone
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

                {/* Company Info */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-600 p-2 rounded-xl">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-sm">შპს გრინლენდ77</p>
                      <p className="text-[10px] text-slate-500">საიდ. კოდი: 445763512</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <a href="tel:+995514017101" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                      <Phone className="h-3.5 w-3.5" />
                      <span>+995 514 01 71 01</span>
                    </a>
                    <a href="https://wa.me/995514017101" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                    <a href="mailto:greenland77distribution@gmail.com" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">greenland77distribution@gmail.com</span>
                    </a>
                  </div>
                </div>
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
