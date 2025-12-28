
import React, { useState } from 'react';
import { useApp } from '../App';
import { Button, Input, Card } from './ui/Shared';
import { Database, ShieldCheck, Zap, Globe, Cpu, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SetupPage = () => {
  const { saveConfig, config } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    companyName: '',
    aiApiKey: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate connection check
    await new Promise(r => setTimeout(r, 1500));
    saveConfig({ ...form, setupComplete: true });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-georgian">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="bg-slate-950 dark:bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
             <Zap className="text-white dark:text-slate-900 h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">სისტემის ინსტალაცია</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">შეიყვანეთ მონაცემები თქვენი Self-hosted გარემოდან</p>
        </div>

        <Card className="p-8 shadow-2xl dark:shadow-none border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">კომპანიის დასახელება</label>
                <div className="relative">
                  <Input required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="მაგ: GDS Logistics" className="pl-12" />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Supabase URL</label>
                    <div className="relative">
                      <Input required value={form.supabaseUrl} onChange={e => setForm({...form, supabaseUrl: e.target.value})} placeholder="https://..." className="pl-12" />
                      <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Supabase Anon Key</label>
                    <div className="relative">
                      <Input required value={form.supabaseKey} onChange={e => setForm({...form, supabaseKey: e.target.value})} placeholder="ey..." className="pl-12" />
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-black text-amber-500 uppercase tracking-widest mb-2">Gemini AI API Key (Optional)</label>
                <div className="relative">
                  <Input value={form.aiApiKey} onChange={e => setForm({...form, aiApiKey: e.target.value})} placeholder="AI ფუნქციებისთვის..." className="pl-12 border-amber-100 dark:border-amber-900/30" />
                  <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">გასაღების გარეშე AI ანალიტიკა არ იქნება ხელმისაწვდომი.</p>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 bg-slate-950 dark:bg-white dark:text-slate-900 text-white font-black text-lg">
              {loading ? <Loader2 className="animate-spin" /> : (
                <>ინსტალაციის დასრულება <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
