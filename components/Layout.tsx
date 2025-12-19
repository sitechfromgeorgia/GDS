
import React from 'react';
import { useApp } from '../App';
import { UserRole } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './ui/Shared';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  LogOut, 
  Menu,
  User,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useApp();
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
          { label: "Settings", icon: Settings, path: '/restaurant/settings' },
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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-900 p-2 rounded-lg">
               <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">GDS</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">Georgian Distribution System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {getNavItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-md transition-all duration-200 text-sm ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="mb-4">
             <LanguageSwitcher />
          </div>
          <div className="flex items-center space-x-3 px-3 py-2 mb-2 bg-slate-50 rounded-lg border border-slate-100">
            {user?.avatar ? (
              <img src={user.avatar} alt="User" className="h-8 w-8 rounded-full bg-slate-200" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                {user?.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <Truck className="h-6 w-6 text-slate-900" />
          <span className="font-bold text-slate-900">GDS</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white absolute top-16 w-full z-40 border-b border-slate-200 shadow-lg">
          <nav className="flex flex-col p-4 space-y-2">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
          {children}
        </div>
      </main>
    </div>
  );
};
