'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const router = useRouter();

  // Klienti i ri SSR
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        setMsg({ type: 'error', text: error.message });
      } else {
        setMsg({ 
          type: 'success', 
          text: 'Llogaria u krijua me sukses! Ju lutem kontrolloni email-in për konfirmim.' 
        });
        // Pastrojmë fushat pas suksesit
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Ndodhi një gabim i papritur.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    // Ky rresht zgjidh problemin tënd: Bën logout që PROXY të lejojë faqen e Loginit
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 italic">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
        
        {/* Header-i i zi me shigjetën Back */}
        <div className="bg-[#1a1a1a] p-10 text-center flex flex-col items-center gap-4 relative">
          <button 
            onClick={handleBackToLogin}
            className="absolute left-8 top-10 text-slate-500 hover:text-red-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="bg-red-600 p-4 rounded-2xl text-white shadow-lg">
            <UserPlus size={32} />
          </div>
          <h1 className="text-white text-3xl font-black uppercase tracking-tighter">
            Regjistrimi
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Krijo llogari të re
          </p>
        </div>

        <form onSubmit={handleRegister} className="p-10 space-y-5">
          {/* Mesazhet e Gabimit/Suksesit */}
          {msg.text && (
            <div className={`p-4 rounded-xl text-[11px] font-bold border flex items-center gap-3 ${
              msg.type === 'error' 
              ? 'bg-red-50 text-red-600 border-red-100' 
              : 'bg-green-50 text-green-600 border-green-100'
            }`}>
              {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {msg.text}
            </div>
          )}

          {/* Emri i Plotë */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emri i Plotë</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold transition-all"
                placeholder="Filan Fisteku"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold transition-all"
                placeholder="email@shembull.com"
              />
            </div>
          </div>

          {/* Fjalëkalimi */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fjalëkalimi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Butoni i Regjistrimit */}
          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-[#1a1a1a] text-white font-black py-5 rounded-2xl hover:bg-red-600 shadow-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Krijo Llogarinë'
            )}
          </button>

          <div className="pt-4 text-center border-t border-slate-50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Keni llogari? {' '}
              <Link href="/login" className="text-red-600 hover:underline">Identifikohuni</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}