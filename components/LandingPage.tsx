
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Button, LanguageSwitcher, Modal, Input, ThemeToggle } from './ui/Shared';
import { Truck, Utensils, LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Background3D = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#020617]">
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
            backgroundSize: 'clamp(40px, 5vw, 80px) clamp(40px, 5vw, 80px)',
            transform: 'rotateX(65deg) translateY(-10%) translateZ(0)',
            maskImage: 'linear-gradient(to top, black, transparent 80%)',
            height: '150%', top: '-25%', animation: 'grid-travel 30s linear infinite',
          }}
        />
      </div>
      <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[140px] animate-blob animation-delay-2000 mix-blend-screen" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,#020617_95%)]" />
      <style>{`
        @keyframes grid-travel { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }
        @keyframes blob { 0% { transform: translate(0, 0) scale(1); } 33% { transform: translate(3%, -5%) scale(1.1); } 66% { transform: translate(-2%, 3%) scale(0.95); } 100% { transform: translate(0, 0) scale(1); } }
        .animate-blob { animation: blob 20s infinite alternate ease-in-out; }
        .animation-delay-2000 { animation-delay: 3s; }
      `}</style>
    </div>
  );
};

export const LandingPage = () => {
  const { login, config } = useApp();
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
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setIsSubmitting(true);
    const success = await login(email, password, rememberMe);
    setIsSubmitting(false);
    if (success) setIsLoginModalOpen(false);
    else setError(i18n.language === 'ka' ? 'ელ-ფოსტა ან პაროლი არასწორია' : 'Invalid email or password');
  };

  const isGeo = i18n.language === 'ka';

  return (
    <div className={`min-h-screen bg-[#020617] text-white font-georgian selection:bg-emerald-500 selection:text-white overflow-x-hidden`}>
      <Background3D />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-[90rem] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 font-black text-2xl tracking-tighter group cursor-pointer">
            <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-xl shadow-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase">{config?.companyName || 'GDS'}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button 
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-sm rounded-xl px-4 sm:px-6 h-11 text-sm font-bold"
            >
              <LogIn className="h-4 w-4 mr-2 text-emerald-400" />
              {t('common.signin')}
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col justify-center min-h-[100vh] px-6">
        <div className="max-w-[90rem] mx-auto w-full">
          <div className="max-w-[65rem]">
            <div className="inline-flex items-center space-x-2 border border-emerald-500/20 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 tracking-[0.3em] uppercase">SYSTEM ONLINE</span>
            </div>
            <h1 className="text-[clamp(2rem,6.5vw,4.5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-10 uppercase">
              {t('landing.hero_title_pre')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-200">
                {t('landing.hero_title_highlight')}
              </span>
            </h1>
            <p className="text-[clamp(1rem,2vw,1.25rem)] text-slate-400 mb-12 max-w-[38rem] leading-[1.6] font-medium opacity-80">
              {t('landing.hero_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Button onClick={() => setIsLoginModalOpen(true)} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-bold text-base rounded-2xl shadow-xl flex items-center justify-center gap-3 group">
                <LogIn className="h-5 w-5" /> {t('landing.login_btn')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title={t('landing.login_title')}>
        <form onSubmit={handleLoginSubmit} className="space-y-6 py-2">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3"><AlertCircle className="h-5 w-5" /><p className="text-sm font-bold">{error}</p></div>}
          <div className="space-y-5">
            <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">{t('common.email')}</label><div className="relative"><Input type="email" required placeholder="admin@gds.ge" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-12 border-slate-100" /><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /></div></div>
            <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">{t('common.password')}</label><div className="relative"><Input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 pr-12 border-slate-100" /><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-slate-950 text-white rounded-2xl font-black text-lg">{isSubmitting ? t('common.loading') : t('landing.login_btn')}</Button>
        </form>
      </Modal>
    </div>
  );
};
