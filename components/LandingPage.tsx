
import React, { useState } from 'react';
import { useApp } from '../App';
import { Button, LanguageSwitcher, Modal, Input } from './ui/Shared';
import { Truck, Utensils, LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, UserCheck, ShieldCheck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandingPage = () => {
  const { login } = useApp();
  const { t, i18n } = useTranslation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isResetView, setIsResetView] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleDemoLogin = (role: string) => {
    if (role === 'DEMO') login('demo@gds.ge', 'gds2025', true);
  };

  const quickFill = (userType: 'admin' | 'rest' | 'driver') => {
    const creds = {
      admin: { e: 'admin@gds.ge', p: 'gds2025' },
      rest: { e: 'khinkali@rest.ge', p: 'gds2025' },
      driver: { e: 'luka@driver.ge', p: 'gds2025' }
    };
    setEmail(creds[userType].e);
    setPassword(creds[userType].p);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError(null);
    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const success = await login(email, password, rememberMe);
    
    setIsSubmitting(false);
    
    if (success) {
      setIsLoginModalOpen(false);
    } else {
      setError(i18n.language === 'ka' ? 'ელ-ფოსტა ან პაროლი არასწორია' : 'Invalid email or password');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setResetSent(true);
  };

  const resetModalState = () => {
    setIsResetView(false);
    setResetSent(false);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const isGeo = i18n.language === 'ka';

  return (
    <div className={`min-h-screen bg-[#0f172a] text-white font-sans selection:bg-emerald-500 selection:text-white ${isGeo ? 'font-georgian' : ''}`}>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-1.5 rounded-lg">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span>GDS</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button 
              onClick={() => {
                resetModalState();
                setIsLoginModalOpen(true);
              }}
              className="bg-transparent border border-white/20 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-all duration-300"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t('common.signin')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 border border-blue-500/30 bg-blue-500/10 rounded-full px-3 py-1 mb-8 backdrop-blur-sm">
              <Truck className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300 tracking-wide uppercase">Distribution V2.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
              {t('landing.hero_title_pre')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-green-400">
                {t('landing.hero_title_highlight')}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
              {t('landing.hero_desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => handleDemoLogin('DEMO')} 
                className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white border-0 font-medium text-base rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Utensils className="h-5 w-5" />
                {t('landing.demo_restaurant')}
              </Button>
              <Button 
                onClick={() => {
                  resetModalState();
                  setIsLoginModalOpen(true);
                }}
                className="h-14 px-8 bg-slate-800/80 border border-slate-700 text-white hover:bg-slate-700 font-medium text-base rounded-lg backdrop-blur-sm transition-all"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('common.signin')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Login / Reset Modal */}
      <Modal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        title={isResetView ? (i18n.language === 'ka' ? 'პაროლის აღდგენა' : 'Reset Password') : t('landing.login_title')}
      >
        {!isResetView ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6 py-2">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500">{t('landing.login_subtitle')}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in zoom-in-95">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')}</label>
                <div className="relative">
                  <Input 
                    type="email" 
                    required
                    placeholder="admin@gds.ge"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">{t('common.password')}</label>
                  <button 
                    type="button" 
                    onClick={() => setIsResetView(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {i18n.language === 'ka' ? 'დაგავიწყდათ პაროლი?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-semibold text-slate-600 cursor-pointer select-none">
                  {i18n.language === 'ka' ? 'დამიმახსოვრე' : 'Remember Me'}
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('landing.login_btn')}
            </Button>
            
            {/* Quick Fill Section - Temporary */}
            <div className="pt-4 border-t border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
                  {t('landing.quick_fill')}
               </p>
               <div className="grid grid-cols-3 gap-2">
                 <button 
                   type="button" 
                   onClick={() => quickFill('admin')}
                   className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all text-slate-600 group"
                 >
                   <ShieldCheck className="h-5 w-5 mb-1 group-hover:text-blue-600" />
                   <span className="text-[9px] font-bold">ADMIN</span>
                 </button>
                 <button 
                   type="button" 
                   onClick={() => quickFill('rest')}
                   className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all text-slate-600 group"
                 >
                   <Utensils className="h-5 w-5 mb-1 group-hover:text-emerald-600" />
                   <span className="text-[9px] font-bold">OBJECT</span>
                 </button>
                 <button 
                   type="button" 
                   onClick={() => quickFill('driver')}
                   className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all text-slate-600 group"
                 >
                   <Truck className="h-5 w-5 mb-1 group-hover:text-indigo-600" />
                   <span className="text-[9px] font-bold">DRIVER</span>
                 </button>
               </div>
            </div>

            <div className="pt-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                <span className="font-bold text-slate-700 uppercase tracking-tight">Credentials Info:</span><br />
                Email: <b>admin@gds.ge</b> / <b>khinkali@rest.ge</b><br />
                Password: <span className="text-blue-600 font-bold">gds2025</span>
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-6 py-2">
            {!resetSent ? (
              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    {i18n.language === 'ka' 
                      ? 'შეიყვანეთ თქვენი ელ-ფოსტა პაროლის აღსადგენად' 
                      : 'Enter your email address to receive a password reset link.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')}</label>
                  <div className="relative">
                    <Input 
                      type="email" 
                      required
                      placeholder="user@gds.ge"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('common.loading') : (i18n.language === 'ka' ? 'ბმულის გაგზავნა' : 'Send Reset Link')}
                </Button>

                <button 
                  type="button" 
                  onClick={() => setIsResetView(false)}
                  className="w-full flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors py-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {i18n.language === 'ka' ? 'ავტორიზაციაზე დაბრუნება' : 'Back to Login'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    {i18n.language === 'ka' ? 'ბმული გაგზავნილია' : 'Link Sent Successfully'}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed px-4">
                    {i18n.language === 'ka' 
                      ? `აღდგენის ინსტრუქცია გაიგზავნა ელ-ფოსტაზე: ${email}` 
                      : `Instructions to reset your password have been sent to: ${email}`}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-slate-200"
                  onClick={resetModalState}
                >
                  {i18n.language === 'ka' ? 'დასრულება' : 'Back to Login'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
