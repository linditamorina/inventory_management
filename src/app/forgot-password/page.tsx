'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, ArrowLeft, Loader2, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Kjo është faqja ku do të dërgohet përdoruesi pasi të klikojë linkun në email
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ 
        type: 'success', 
        text: 'Instruksionet u dërguan! Kontrolloni email-in tuaj.' 
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 italic">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        <div className="bg-[#1a1a1a] p-10 text-center flex flex-col items-center gap-4 relative">
          <Link href="/login" className="absolute left-8 top-10 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="bg-red-600 p-4 rounded-2xl text-white shadow-lg">
            <Send size={32} />
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter">Reset Password</h1>
        </div>

        <form onSubmit={handleResetRequest} className="p-10 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-[11px] font-bold border flex items-center gap-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : null}
              {message.text}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email-i i llogarisë</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 font-bold transition-all"
                placeholder="shkruaj@emailin.tuaj"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white font-black py-5 rounded-2xl hover:bg-red-600 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Dërgo Linkun'}
          </button>
        </form>
      </div>
    </div>
  );
}