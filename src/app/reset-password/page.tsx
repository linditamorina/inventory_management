'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState({ current: false, new: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Llogaritja e gjatësisë për feedback vizual
  const isPasswordValid = newPassword.length >= 6;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validimi paraprak
    if (!isPasswordValid) {
      setMessage({ type: 'error', text: 'FJALËKALIMI DUHET TË JETË TË PAKTËN 6 KARAKTERE.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Përdoruesi nuk u gjet.");

      // Verifikimi i fjalëkalimit aktual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error("Fjalëkalimi aktual është i pasaktë.");

      // Përditësimi i fjalëkalimit
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'FJALËKALIMI U NDRYSHUA ME SUKSES!' });
      setCurrentPassword('');
      setNewPassword('');
      
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message.toUpperCase() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 italic">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <button 
          onClick={() => router.back()} 
          className="absolute left-6 top-8 text-white/50 hover:text-white z-10 p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="bg-red-600 p-12 text-center text-white">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Siguria e Llogarisë</h1>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] mt-2 text-white/80">Përditëso fjalëkalimin tënd</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-10 space-y-5">
          {message.text && (
            <div className={`p-4 rounded-2xl text-[11px] font-black border flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* INPUT: FJALËKALIMI AKTUAL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fjalëkalimi Aktual</label>
            <div className="relative">
              <input 
                required 
                type={showPass.current ? "text" : "password"} 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold transition-all" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPass({...showPass, current: !showPass.current})}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-600"
              >
                {showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* INPUT: FJALËKALIMI I RI */}
          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fjalëkalimi i Ri</label>
              <span className={`text-[9px] font-black uppercase ${isPasswordValid ? 'text-green-500' : 'text-slate-300'}`}>
                Min. 6 karaktere
              </span>
            </div>
            <div className="relative">
              <input 
                required 
                type={showPass.new ? "text" : "password"} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className={`w-full p-4 pr-12 bg-slate-50 border rounded-2xl outline-none transition-all font-bold ${
                    newPassword.length > 0 ? (isPasswordValid ? 'border-green-200 focus:ring-green-500' : 'border-red-200 focus:ring-red-600') : 'border-slate-200 focus:ring-red-600'
                }`}
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPass({...showPass, new: !showPass.new})}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-600"
              >
                {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Treguesi vizual i progresit */}
            <div className="flex gap-1 mt-2 px-1">
                {[1, 2, 3].map((step) => (
                    <div 
                        key={step} 
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                            newPassword.length >= step * 2 ? (isPasswordValid ? 'bg-green-500' : 'bg-red-500') : 'bg-slate-100'
                        }`} 
                    />
                ))}
            </div>
          </div>

          <button 
            disabled={loading || (newPassword.length > 0 && !isPasswordValid)} 
            type="submit"
            className="w-full bg-[#1a1a1a] text-white font-black py-5 rounded-2xl hover:bg-red-600 shadow-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:bg-slate-200 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                    <ShieldCheck size={20} />
                    <span>Përditëso Sigurinë</span>
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}