'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Languages } from 'lucide-react';
import Link from 'next/link';
// Marrim language dhe setLanguage nga context
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Marrim t për përkthime dhe setLanguage për ndërrimin
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Funksioni për të ndërruar gjuhën
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sq' : 'en');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 italic text-slate-900 relative">
      
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* HEADER - Shtojmë 'relative' këtu që butoni të qëndrojë brenda */}
        <div className="bg-red-600 p-10 text-center flex flex-col items-center gap-4 relative">
          
          {/* BUTONI I GJUHËS (Stili si te Register) */}
          <button 
            type="button"
            onClick={toggleLanguage}
            className="absolute right-8 top-10 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/80 px-3 py-1.5 rounded-xl transition-all border border-white/20"
          >
            <Languages size={16} />
            <span className="text-[10px] font-black uppercase">
              {language === 'en' ? 'SQ' : 'EN'}
            </span>
          </button>

          <div className="bg-white p-4 rounded-2xl text-red-600 shadow-lg">
            <LogIn size={32} />
          </div>
          <h1 className="text-white text-3xl font-black uppercase tracking-tighter">IMS SYSTEM</h1>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-bold border border-red-100 flex items-center gap-2 animate-pulse">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {/* EMAIL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {t('email_label')}
            </label>
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

          {/* PASSWORD */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {t('password_label')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold transition-all" 
                placeholder="••••••••"
              />
              
              <button type="button" onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* HARROUAT FJALËKALIMIN */}
          <div className="text-right">
            <Link 
              href="/forgot-password" 
              className="text-[10px] text-slate-400 font-black uppercase hover:text-red-600 transition-all tracking-tighter decoration-red-600 decoration-2 underline-offset-4"
            >
              {t('forgot_password')}
            </Link>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-[#1a1a1a] text-white font-black py-5 rounded-2xl hover:bg-red-600 shadow-xl shadow-black/10 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t('login_button')}
          </button>

          {/* Register Link
<div className="pt-4 text-center border-t border-slate-100">
  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
    {t('no_account')} {' '}
    <Link href="/register" className="text-red-600 hover:underline font-black">
      {t('register_link')}
    </Link>
  </p>
</div>
*/}
        </form>
      </div>
    </div>
  );
}