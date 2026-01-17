
import React, { useState } from 'react';
import { useApp } from '../App';
import { Button, LanguageSwitcher, Modal, Input, ThemeToggle, Card } from './ui/Shared';
import { Truck, LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, Zap, ShieldCheck, Globe, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BackgroundFX = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#020617]">
    <div className="absolute inset-0 opacity-[0.2]" style={{ perspective: '1000px' }}>
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          transform: 'rotateX(60deg) translateY(-20%)',
          maskImage: 'linear-gradient(to top, black, transparent 70%)',
          height: '200%'
        }}
      />
    </div>
    <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
  </div>
);

export const LandingPage = () => {
  const { login, config } = useApp();
  const { t } = useTranslation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const success = await login(email, password, rememberMe);
    setIsSubmitting(false);
    if (!success) setError(t('common.invalid_credentials'));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-georgian selection:bg-emerald-500/30 overflow-x-hidden">
      <BackgroundFX />

      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 font-black text-2xl tracking-tighter uppercase">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20"><Truck className="h-6 w-6 text-white" /></div>
            <span>{config?.companyName || 'GDS'}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button onClick={() => setIsLoginModalOpen(true)} className="bg-white/5 border border-white/10 hover:bg-white/10 h-11 px-6 rounded-xl font-bold">
              {t('common.signin')}
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase">SYSTEM VERSION 2.0 LIVE</span>
          </div>
          
          <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-[1.05] tracking-tight mb-8 uppercase">
            {t('landing.hero_title_pre')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-200">
              {t('landing.hero_title_highlight')}
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed font-medium">
            {t('landing.hero_desc')}
          </p>

          <div className="flex flex-wrap gap-6">
            <Button onClick={() => setIsLoginModalOpen(true)} className="h-16 px-10 bg-emerald-600 hover:bg-emerald-500 border-none rounded-2xl text-lg font-black shadow-2xl shadow-emerald-600/20 transition-all hover:scale-105">
              {t('landing.login_btn')}
            </Button>
            <Button 
                onClick={() => login('demo@gds.ge', 'gds2025')}
                className="h-16 px-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-lg font-bold backdrop-blur-md transition-all hover:scale-105"
            >
              {t('landing.demo_btn') || 'Live Demo'}
            </Button>
            <div className="flex items-center gap-6 px-4">
               <div className="flex -space-x-3">
                 {[1,2,3].map(i => <div key={i} className="h-10 w-10 rounded-full border-2 border-[#020617] bg-slate-800" />)}
               </div>
               <div className="text-sm font-bold text-slate-400">
                  <span className="text-white">500+</span> {t('landing.businesses_trust')}
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
           {[
             { icon: ShieldCheck, title: 'უსაფრთხოება', desc: 'Secure data encryption and automated cloud backups' },
             { icon: Globe, title: 'ლოკალური', desc: 'Customized logistics for the unique Georgian market' },
             { icon: BarChart3, title: 'ანალიტიკა', desc: 'In-depth business intelligence and sales reporting' }
           ].map((feat, i) => (
             <Card key={i} className="p-8 bg-white/5 border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
               <feat.icon className="h-10 w-10 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
               <h3 className="text-xl font-black mb-3 uppercase tracking-tight">{feat.title}</h3>
               <p className="text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
             </Card>
           ))}
        </div>
      </main>

      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title={t('landing.login_title')}>
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-3"><AlertCircle className="h-4 w-4" />{error}</div>}
          <div className="space-y-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('common.email')}</label><div className="relative"><Input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="admin@gds.ge" className="pl-12" /><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /></div></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('common.password')}</label><div className="relative"><Input value={password} onChange={e => setPassword(e.target.value)} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-12 pr-12" /><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-colors focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{t('common.remember_me')}</span>
            </label>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-slate-950 text-white rounded-2xl font-black text-lg shadow-xl">
            {isSubmitting ? t('common.loading') : t('landing.login_btn')}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
