import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, CheckCircle2, AlertCircle, Info, AlertTriangle, X, LucideIcon } from 'lucide-react';
import { useApp } from '../../App';

// Button
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]";
    const variants = {
      primary: "bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white focus:ring-slate-950 dark:focus:ring-slate-100 shadow-sm",
      secondary: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm",
      outline: "border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-11 px-5 text-sm",
      lg: "h-14 px-8 text-base",
    };
    return (
      <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
    );
  }
);

// Card
export const Card: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {children}
  </div>
);

// Badge
export const Badge = ({ children, variant = 'default', className = '' }: { children?: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info', className?: string }) => {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-bold",
    success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 font-bold",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 font-bold",
    destructive: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-400 border-red-200 dark:border-red-900/50 font-bold",
    outline: "text-slate-900 dark:text-slate-100 border-2 border-slate-100 dark:border-slate-800 font-bold",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 font-bold"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Input
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-11 w-full rounded-lg border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-950 dark:text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm ${className}`}
        {...props}
      />
    );
  }
);

// Modal with Accessibility (ARIA, Focus Trap, Keyboard Navigation)
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Generate unique IDs for ARIA
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);

  // Handle Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }

    // Focus trap - Tab key handling
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus the close button after a short delay (for animation)
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';

        // Restore focus to previous element
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col scale-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 border-t sm:border border-white/20 dark:border-slate-800"
      >
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2
            id={titleId.current}
            className="text-lg sm:text-xl font-bold text-slate-950 dark:text-slate-100 tracking-tight truncate pr-2"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="მოდალის დახურვა"
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Toast
export const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info' | 'warning', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />
  };

  const colors = {
    success: "border-emerald-100 dark:border-emerald-900/50 bg-white/90 dark:bg-slate-900/90 shadow-emerald-500/10",
    error: "border-rose-100 dark:border-rose-900/50 bg-white/90 dark:bg-slate-900/90 shadow-rose-500/10",
    info: "border-blue-100 dark:border-blue-900/50 bg-white/90 dark:bg-slate-900/90 shadow-blue-500/10",
    warning: "border-amber-100 dark:border-amber-900/50 bg-white/90 dark:bg-slate-900/90 shadow-amber-500/10"
  };

  return (
    <div className={`flex items-center gap-3 p-4 pr-12 rounded-2xl border-2 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 relative ${colors[type]}`}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{message}</p>
      <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Language Switcher
export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ka' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      <Globe className="h-4 w-4" />
      <span>{i18n.language === 'ka' ? 'ENG' : 'GEO'}</span>
    </button>
  );
};

// Theme Toggle
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useApp();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};

// Skeleton Base
const SkeletonBase = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
);

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="flex items-start gap-4">
      <SkeletonBase className="h-16 w-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/2" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
    </div>
  </div>
);

// Order Row Skeleton
export const OrderRowSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-32" />
          <SkeletonBase className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-6 w-20 rounded-full" />
        <SkeletonBase className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  </div>
);

// Memoized StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: number;
  suffix?: string;
}

export const StatCard = memo(({ title, value, icon: Icon, color, change, suffix = '' }: StatCardProps) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}{suffix}</h3>
        {change !== undefined && (
          <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </Card>
));

StatCard.displayName = 'StatCard';

// Stat Card Skeleton
export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBase className="h-3 w-20" />
        <SkeletonBase className="h-8 w-16" />
      </div>
      <SkeletonBase className="h-12 w-12 rounded-xl" />
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <OrderRowSkeleton key={i} />
    ))}
  </div>
);

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard Skeleton (for lazy loading)
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <TableSkeleton rows={5} />
  </div>
);
