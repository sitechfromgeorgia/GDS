
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
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

// Modal
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 border border-white/20 dark:border-slate-800">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-950 dark:text-slate-100 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
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
