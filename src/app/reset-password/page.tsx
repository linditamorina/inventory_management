'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: 'Fjalëkalimi u ndryshua me sukses!' });
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 italic">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="bg-red-600 p-10 text-center text-white font-black uppercase italic">
          <Lock className="mx-auto mb-4" size={40} />
          <h1 className="text-2xl tracking-tighter">Fjalëkalim i Ri</h1>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-10 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-[11px] font-bold border flex items-center gap-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shkruaj fjalëkalimin e ri</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold"
              placeholder="••••••••"
            />
          </div>

          <button disabled={loading} className="w-full bg-[#1a1a1a] text-white font-black py-5 rounded-2xl hover:bg-red-600 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Përditëso Fjalëkalimin'}
          </button>
        </form>
      </div>
    </div>
  );
}