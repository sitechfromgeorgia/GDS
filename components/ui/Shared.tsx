
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

// Button
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]";
    const variants = {
      primary: "bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-950 shadow-sm",
      secondary: "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm",
      outline: "border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 hover:border-slate-300",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
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
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {children}
  </div>
);

// Badge
export const Badge = ({ children, variant = 'default', className = '' }: { children?: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline', className?: string }) => {
  const variants = {
    default: "bg-slate-100 text-slate-900 border-slate-200 font-bold",
    success: "bg-emerald-100 text-emerald-900 border-emerald-200 font-bold",
    warning: "bg-amber-100 text-amber-900 border-amber-200 font-bold",
    destructive: "bg-red-100 text-red-900 border-red-200 font-bold",
    outline: "text-slate-900 border-2 border-slate-100 font-bold"
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
        className={`flex h-11 w-full rounded-lg border-2 border-slate-100 bg-white px-4 py-2 text-sm text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm ${className}`}
        {...props}
      />
    );
  }
);

// Modal
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-950 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
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
      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all border border-transparent hover:border-slate-200"
    >
      <Globe className="h-4 w-4" />
      <span>{i18n.language === 'ka' ? 'ENG' : 'GEO'}</span>
    </button>
  );
};
