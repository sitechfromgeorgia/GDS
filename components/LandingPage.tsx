
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Button, LanguageSwitcher, Modal, Input } from './ui/Shared';
import { Truck, Utensils, LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Background3D = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#020617]">
      {/* 3D Perspective Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #334155 1px, transparent 1px),
              linear-gradient(to bottom, #334155 1px, transparent 1px)
            `,
            backgroundSize: 'clamp(40px, 5vw, 80px) clamp(40px, 5vw, 80px)',
            transform: 'rotateX(65deg) translateY(-10%) translateZ(0)',
            maskImage: 'linear-gradient(to top, black, transparent 80%)',
            height: '150%',
            top: '-25%',
            animation: 'grid-travel 30s linear infinite',
          }}
        />
      </div>
      
      {/* Floating Dynamic Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[140px] animate-blob animation-delay-2000 mix-blend-screen" />
      <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] bg-indigo-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen" />
      
      {/* Scanline & Grain Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-100" />
      
      {/* Global Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,#020617_95%)]" />

      <style>{`
        @keyframes grid-travel {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, -5%) scale(1.1); }
          66% { transform: translate(-2%, 3%) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob {
          animation: blob 20s infinite alternate ease-in-out;
        }
        .animation-delay-2000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 6s; }
      `}</style>
    </div>
  );
};

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
    <div className={`min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden ${isGeo ? 'font-georgian' : ''}`}>
      <Background3D />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-[90rem] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 font-black text-2xl tracking-tighter group cursor-pointer">
            <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">GDS</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <LanguageSwitcher />
            <Button 
              onClick={() => {
                resetModalState();
                setIsLoginModalOpen(true);
              }}
              className="bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 rounded-xl px-4 sm:px-6 h-11 text-sm font-bold"
            >
              <LogIn className="h-4 w-4 mr-2 text-emerald-400" />
              {t('common.signin')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col justify-center min-h-[100vh] px-6">
        <div className="max-w-[90rem] mx-auto w-full">
          <div className="max-w-[65rem]">
            <div className="inline-flex items-center space-x-2 border border-emerald-500/20 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 tracking-[0.3em] uppercase">Distribution V2.0</span>
            </div>
            
            <h1 className="text-[clamp(2rem,6.5vw,4.5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-10">
              <span className="text-white opacity-90">{t('landing.hero_title_pre')}</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-200 drop-shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                {t('landing.hero_title_highlight')}
              </span>
            </h1>
            
            <p className="text-[clamp(1rem,2vw,1.25rem)] text-slate-400 mb-12 max-w-[38rem] leading-[1.6] font-medium opacity-80">
              {t('landing.hero_desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Button 
                onClick={() => handleDemoLogin('DEMO')} 
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-bold text-base rounded-2xl transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 group active:scale-95"
              >
                <Utensils className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                {t('landing.demo_restaurant')}
              </Button>
              <Button 
                onClick={() => {
                  resetModalState();
                  setIsLoginModalOpen(true);
                }}
                className="h-14 px-8 bg-slate-800/40 border border-slate-700/50 text-white hover:bg-slate-700/60 font-bold text-base rounded-2xl backdrop-blur-md transition-all duration-300 active:scale-95"
              >
                <LogIn className="h-5 w-5 mr-3 text-blue-400" />
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
        title={isResetView ? (i18n.language === 'ka' ? 'აღდგენა' : 'Reset') : t('landing.login_title')}
      >
        {!isResetView ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6 py-2">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 font-medium">{t('landing.login_subtitle')}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-[0.15em]">{t('common.email')}</label>
                <div className="relative">
                  <Input 
                    type="email" 
                    required
                    placeholder="admin@gds.ge"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 bg-slate-50 border-slate-100 h-12 text-sm font-medium"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{t('common.password')}</label>
                  <button 
                    type="button" 
                    onClick={() => setIsResetView(true)}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-tighter transition-colors"
                  >
                    {i18n.language === 'ka' ? 'დაგავიწყდათ?' : 'Forgot?'}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 bg-slate-50 border-slate-100 h-12 text-sm font-medium"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-slate-200 rounded-lg cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm font-bold text-slate-600 cursor-pointer select-none">
                  {i18n.language === 'ka' ? 'დამიმახსოვრე' : 'Remember Me'}
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-slate-950 hover:bg-slate-900 text-white shadow-2xl shadow-slate-200 rounded-2xl font-black text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('landing.login_btn')}
            </Button>
            
            <div className="pt-6 border-t border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-4">
                  {t('landing.quick_fill')}
               </p>
               <div className="grid grid-cols-3 gap-3">
                 <button 
                   type="button" 
                   onClick={() => quickFill('admin')}
                   className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-50 hover:border-blue-500/20 hover:bg-blue-50 transition-all text-slate-600 group"
                 >
                   <ShieldCheck className="h-6 w-6 mb-1.5 group-hover:text-blue-600 transition-colors" />
                   <span className="text-[10px] font-black tracking-tighter">ADMIN</span>
                 </button>
                 <button 
                   type="button" 
                   onClick={() => quickFill('rest')}
                   className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-50 hover:border-emerald-500/20 hover:bg-emerald-50 transition-all text-slate-600 group"
                 >
                   <Utensils className="h-6 w-6 mb-1.5 group-hover:text-emerald-600 transition-colors" />
                   <span className="text-[10px] font-black tracking-tighter">OBJECT</span>
                 </button>
                 <button 
                   type="button" 
                   onClick={() => quickFill('driver')}
                   className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-50 hover:border-indigo-500/20 hover:bg-indigo-50 transition-all text-slate-600 group"
                 >
                   <Truck className="h-6 w-6 mb-1.5 group-hover:text-indigo-600 transition-colors" />
                   <span className="text-[10px] font-black tracking-tighter">DRIVER</span>
                 </button>
               </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6 py-2">
            {!resetSent ? (
              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {i18n.language === 'ka' 
                      ? 'შეიყვანეთ ელ-ფოსტა პაროლის აღსადგენად' 
                      : 'Enter email to receive reset link.'}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-[0.15em]">{t('common.email')}</label>
                  <div className="relative">
                    <Input 
                      type="email" 
                      required
                      placeholder="user@gds.ge"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 bg-slate-50 border-slate-100 h-12 font-medium"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-black"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('common.loading') : (i18n.language === 'ka' ? 'ბმულის გაგზავნა' : 'Send Reset Link')}
                </Button>

                <button 
                  type="button" 
                  onClick={() => setIsResetView(false)}
                  className="w-full flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors py-2 uppercase tracking-[0.2em]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {i18n.language === 'ka' ? 'უკან' : 'Back'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="h-20 w-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-950 mb-2">
                    {i18n.language === 'ka' ? 'ბმული გაიგზავნა' : 'Link Sent'}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {i18n.language === 'ka' 
                      ? `ინსტრუქცია გაიგზავნა: ${email}` 
                      : `Instructions sent to: ${email}`}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-14 border-2 border-slate-100 rounded-2xl font-black"
                  onClick={resetModalState}
                >
                  {i18n.language === 'ka' ? 'დასრულება' : 'Done'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
