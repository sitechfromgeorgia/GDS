import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../App';
import { Button, Card, Input } from '../ui/Shared';
import { Bot, Send, X, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const AdminAIChat = () => {
  const { config, orders, products, user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (user?.role !== 'ADMIN') return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // Fix: Strictly follow initialization guidelines by using process.env.API_KEY directly as a string.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const systemInstruction = `
        You are GDS AI Assistant for the administrator of "${config?.companyName || 'GDS'}".
        App State Context:
        - Total Orders: ${orders.length}
        - Total Products: ${products.length}
        - Revenue to date: $${orders.reduce((a, b) => a + (b.totalCost || 0), 0)}
        - Net Profit: $${orders.reduce((a, b) => a + (b.totalProfit || 0), 0)}
        - Top Products: ${products.slice(0, 5).map(p => p.name).join(', ')}

        Analyze data and answer questions accurately. Perform calculations if asked about margins, growth, or forecasts.
        Be concise and professional. Use Georgian if the user asks in Georgian.
      `;

      // Fix: Using gemini-3-pro-preview for complex reasoning and business analysis tasks.
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userMsg,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      // Fix: Directly access the .text property from the response object instead of calling it as a method.
      const text = response.text || "ბოდიში, პასუხის გენერირება ვერ მოხერხდა.";
      setMessages(prev => [...prev, { role: 'ai', text }]);
    } catch (e) {
      console.error("Gemini AI Error:", e);
      setMessages(prev => [...prev, { role: 'ai', text: "ბოდიში, კავშირის პრობლემაა. შეამოწმეთ API გასაღები." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[150]">
      {isOpen ? (
        <Card className="w-[400px] h-[500px] flex flex-col shadow-2xl border-2 border-slate-900 dark:border-white animate-in slide-in-from-bottom-5">
          <div className="p-4 bg-slate-950 text-white flex justify-between items-center rounded-t-xl">
             <div className="flex items-center gap-2">
               <Bot className="h-5 w-5 text-emerald-400" />
               <span className="font-black text-xs uppercase tracking-widest">AI Command Center</span>
             </div>
             <button onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
             {messages.length === 0 && (
               <div className="text-center py-10 space-y-4">
                  <Sparkles className="h-10 w-10 text-amber-500 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">დასვით კითხვა ბიზნესის შესახებ</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => setInput("დათვალე საშუალო მოგება შეკვეთაზე")} className="text-[10px] p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors">"დათვალე საშუალო მოგება შეკვეთაზე"</button>
                    <button onClick={() => setInput("რომელ კატეგორიას აქვს ყველაზე მეტი ბრუნვა?")} className="text-[10px] p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors">"რომელ კატეგორიას აქვს ყველაზე მეტი ბრუნვა?"</button>
                  </div>
               </div>
             )}
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white'}`}>
                    {m.text}
                  </div>
               </div>
             ))}
             {loading && <div className="flex justify-start"><Loader2 className="animate-spin h-4 w-4 text-slate-400" /></div>}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
             <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
               <Input value={input} onChange={e => setInput(e.target.value)} placeholder="დაწერეთ..." className="h-10 text-xs" />
               <Button type="submit" className="h-10 w-10 p-0"><Send className="h-4 w-4" /></Button>
             </form>
          </div>
        </Card>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-950 dark:bg-white text-white dark:text-slate-900 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group"
        >
          <Bot className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          <span className="font-black text-[10px] uppercase tracking-widest overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-500">AI Expert</span>
        </button>
      )}
    </div>
  );
};
