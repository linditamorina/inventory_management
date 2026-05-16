'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tag, User, BarChart3 } from 'lucide-react'; // Shtova BarChart3 për Reports
import Navbar from '../../components/layout/Navbar';
import InventoryChat from '../../components/chat/InventoryChat';
import { supabase } from '../../lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => { if (data) setUserRole(data.role); });
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-[#f8fafc]">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1a1a1a] text-white flex flex-col shrink-0 italic z-[100]">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="bg-red-600 p-2 rounded-lg text-white"><Package size={22} /></div>
          <span className="text-xl font-black uppercase tracking-tighter">Inventory</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 font-bold text-sm">
          {/* Dashboard - Të gjithë */}
          <Link href="/dashboard" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/dashboard' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>

          {/* Inventory - Të gjithë */}
          <Link href="/inventory" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/inventory' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Package size={20} /> Inventory
          </Link>

          {/* Reports - Të gjithë */}
          <Link href="/reports" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/reports' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <BarChart3 size={20} /> Reports
          </Link>

          {/* Admin Only Links */}
          {userRole === 'admin' && (
            <>
              <Link href="/categories" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/categories' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                <Tag size={20} /> Categories
              </Link>

              <Link href="/dashboard/staff" className={`flex items-center gap-4 px-4 py-3 rounded-xl ${pathname === '/dashboard/staff' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                <User size={20} /> Staff
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* PJESA KRYESORE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-10">
          {children}
        </main>
      </div>

      {userRole === 'admin' && <InventoryChat />}
    </div>
  );
}