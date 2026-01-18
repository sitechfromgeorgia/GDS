
import React, { useState } from 'react';
import { useApp } from '../App';
import { Button, LanguageSwitcher, Modal, Input, ThemeToggle, Card } from './ui/Shared';
import { Truck, LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, Zap, ShieldCheck, Globe, BarChart3, Award, BadgePercent, Scale, Sparkles } from 'lucide-react';
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
              {t('landing.demo_btn')}
            </Button>
          </div>
        </div>

        {/* About Section */}
        <section className="mt-32 py-16 px-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                ჩვენს შესახებ
              </span>
            </h2>

            <p className="text-lg text-slate-300 leading-relaxed mb-12">
              კომპანია „გრინლენდ77" წარმოადგენს საიმედო პარტნიორს დისტრიბუციისა და მომარაგების სფეროში.
              უკვე <span className="text-emerald-400 font-bold">3 წელია</span>, რაც ჩვენი გუნდი ბაზარზე ოპერირებს და
              მომხმარებელს სთავაზობს უმაღლესი ხარისხის პროდუქციასა და გამართულ ლოჯისტიკურ სერვისს.
            </p>

            <div className="mb-12">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-white">
                რატომ ჩვენ?
              </h3>
              <p className="text-slate-400 mb-8">
                ჩვენი საქმიანობის მთავარი პრინციპია ხარისხისა და კომფორტის იდეალური ბალანსი.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all hover:scale-105">
                  <Award className="h-10 w-10 text-emerald-500 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-2">უმაღლესი ხარისხი</h4>
                  <p className="text-sm text-slate-400">მკაცრად ვაკონტროლებთ თითოეული მოწოდებული საქონლის სტანდარტს</p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all hover:scale-105">
                  <BadgePercent className="h-10 w-10 text-emerald-500 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-2">კონკურენტული ფასები</h4>
                  <p className="text-sm text-slate-400">საფასო პოლიტიკა მორგებულია მომხმარებლის ინტერესებზე</p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all hover:scale-105">
                  <Scale className="h-10 w-10 text-emerald-500 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-2">იურიდიული გამჭვირვალობა</h4>
                  <p className="text-sm text-slate-400">100%-ით დაზღვეული თანამშრომლობა იურიდიული კუთხით</p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all hover:scale-105">
                  <Sparkles className="h-10 w-10 text-emerald-500 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-2">მაქსიმალური კომფორტი</h4>
                  <p className="text-sm text-slate-400">სწრაფი, მოქნილი და ორიენტირებული თქვენს საჭიროებებზე</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-lg text-slate-300 italic">
                „ჩვენი მიზანია, ვიყოთ <span className="text-emerald-400 font-semibold">ხიდი ხარისხსა და თქვენს ბიზნესს შორის</span>,
                შევქმნათ გრძელვადიანი და ურთიერთსასარგებლო პარტნიორობა."
              </p>
            </div>

            {/* Contact Info */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">დაგვიკავშირდით</h3>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-xl">
                  <Mail className="h-5 w-5 text-emerald-500" />
                  <a href="mailto:greenland77distribution@gmail.com" className="text-slate-300 hover:text-emerald-400 transition-colors">
                    greenland77distribution@gmail.com
                  </a>
                </div>
                <a href="tel:+995514017101" className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-slate-300">+995 514 01 71 01</span>
                </a>
                <a href="https://wa.me/995514017101" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-emerald-600/20 border border-emerald-500/30 px-6 py-3 rounded-xl hover:bg-emerald-600/30 transition-colors">
                  <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-emerald-400 font-medium">WhatsApp</span>
                </a>
              </div>
              <p className="text-sm text-slate-500 mt-4">საიდენტიფიკაციო კოდი: 445763512</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
           {[
             { icon: ShieldCheck, title: t('landing.feature_security'), desc: t('landing.feature_security_desc') },
             { icon: Globe, title: t('landing.feature_local'), desc: t('landing.feature_local_desc') },
             { icon: BarChart3, title: t('landing.feature_analytics'), desc: t('landing.feature_analytics_desc') }
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
