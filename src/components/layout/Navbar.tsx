'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, HelpCircle, X, User, ShieldCheck, LogOut, ChevronRight, Key } from 'lucide-react'; 
import { useNotifications } from '../../hooks/useNotification';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const { notifications, unreadCount, deleteNotification, markAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const userFullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Duke ngarkuar...';
  const userEmail = user?.email || 'pa email';
  
  const getInitials = (name: string) => {
    if (!name || name === 'Duke ngarkuar...') return '...';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 relative z-[50]">
      <div className="flex-1">
        <h2 className="text-sm font-black text-slate-400 italic uppercase tracking-[0.2em]">
          Inventory <span className="text-slate-900">Management</span>
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* NJOFTIMET */}
        <div className="relative" ref={dropdownRef}>
          <div className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all relative" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Bell size={20} className={`transition-colors ${isDropdownOpen ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white animate-pulse">{unreadCount}</span>
            )}
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-80 bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-6 z-[100] animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                <h3 className="font-black italic text-slate-800 uppercase text-xs">Njoftimet</h3>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} REJA</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length > 0 ? notifications.map((n: any) => (
                  <div key={n.id} className={`relative p-3 rounded-2xl text-[11px] font-bold border-l-4 ${n.is_read ? 'bg-white text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-red-500 hover:bg-slate-100'}`} onClick={() => markAsRead(n.id)}>
                    <div className="pr-6">{n.message}</div>
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="absolute right-2 top-3 p-1 text-slate-300 hover:text-red-600"><X size={14} strokeWidth={3} /></button>
                  </div>
                )) : <p className="text-center text-slate-400 py-6 italic text-xs">Nuk ka njoftime</p>}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE SECTION */}
        <div className="relative" ref={profileRef}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-4 border-l border-slate-100 ml-2 cursor-pointer group select-none">
            <div className="flex flex-col items-end hidden lg:flex">
              <span className="text-xs font-black text-slate-900 italic uppercase tracking-tighter leading-none group-hover:text-red-600 transition-colors">{userFullName}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-1">
                <ShieldCheck size={10} className="text-red-600" /> {userRole === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </div>
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black italic shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-all border-2 border-white">
              {getInitials(userFullName)}
            </div>
          </div>

          {/* PROFILE DROPDOWN */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-4 w-72 bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-red-600 p-8 text-center text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl mx-auto mb-4 flex items-center justify-center border border-white/30 text-2xl font-black italic">
                  {getInitials(userFullName)}
                </div>
                <h4 className="font-black italic uppercase tracking-tighter text-sm">{userFullName}</h4>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">{userEmail}</p>
              </div>

              <div className="p-4 space-y-1">
                {userRole === 'admin' && (
                  <button onClick={() => { setIsProfileOpen(false); router.push('/dashboard/staff'); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors"><User size={16} /></div>
                      <span className="text-[11px] font-black uppercase text-slate-600 italic">Menaxho Stafin</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                )}
                
                <button onClick={() => { setIsProfileOpen(false); router.push('/reset-password'); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors"><Key size={16} /></div>
                    <span className="text-[11px] font-black uppercase text-slate-600 italic">Ndrysho Fjalëkalimin</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-2xl transition-all group mt-2">
                  <div className="p-2 bg-red-100 rounded-xl text-red-600"><LogOut size={16} /></div>
                  <span className="text-[11px] font-black uppercase text-red-600 italic">Dil nga Sistemi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}