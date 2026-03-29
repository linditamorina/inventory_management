'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Shto useRouter
import { createBrowserClient } from '@supabase/ssr'; // Shto këtë
import { LayoutDashboard, Package, LogOut, Settings, Bell, User } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Krijojmë klientin për të bërë Logout
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    try {
      // 1. Mbyllet session-i në Supabase
      await supabase.auth.signOut();
      
      // 2. Pastrohet cache-i i Next.js dhe dërgohet te Login
      router.push('/login');
      router.refresh(); 
    } catch (error) {
      console.error('Gabim gjatë daljes:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <aside className="w-64 bg-[#1a1a1a] text-white flex flex-col shrink-0 italic">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="bg-red-600 p-2 rounded-lg text-white"><Package size={22} /></div>
          <span className="text-xl font-black uppercase tracking-tighter">Inventory</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 font-bold text-sm">
          <Link href="/dashboard" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/dashboard' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/inventory" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/dashboard/inventory' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Package size={20} /> Inventory
          </Link>
        </nav>

        {/* PJESA E LOGOUT - E PËRDITËSUAR */}
        <div className="p-4 border-t border-white/5 space-y-4 text-slate-400 font-bold text-sm">
          <div className="flex items-center gap-4 px-4 cursor-pointer hover:text-white transition-all">
            <Settings size={20} /> Settings
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-4 px-4 w-full text-red-500 hover:text-red-400 transition-all font-bold"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden italic">
        {/* Header... (mbetet i njëjtë) */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-black text-slate-900 uppercase">Overview</h2>
          <div className="flex items-center gap-4">
            <Bell size={20} className="text-slate-400 cursor-pointer" />
            <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-red-600/10 flex items-center justify-center text-slate-400">
               <User size={20} />
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-10">
          {children}
        </main>
      </div>
    </div>
  );
}