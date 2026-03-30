'use client';

import React, { useState } from 'react';
import { Bell, Settings, HelpCircle, User } from 'lucide-react'; // Hoqëm Search
import { useNotifications } from '../../hooks/useNotification';

export default function Navbar() {
  const { notifications, unreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 relative z-[50]">
      
      {/* PJESA E MAJTË - Tani është bosh ose mund të vendosësh një titull faqeje */}
      <div className="flex-1">
        {/* Mund ta lësh bosh për minimalizëm, ose të shtosh një titull dinamik */}
        <h2 className="text-sm font-medium text-slate-500 italic uppercase tracking-wider">
          Inventory Management
        </h2>
      </div>

      {/* PJESA E DJATHTË - Ikonat e kontrollit */}
      <div className="flex items-center gap-6">
        
        {/* BUTONI I NJOFTIMEVE (ZILJA) */}
        <div className="relative cursor-pointer group" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <Bell size={20} className="text-slate-400 group-hover:text-red-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
              {unreadCount}
            </span>
          )}
          
          {/* DROP-DOWN I NJOFTIMEVE (Këtu shfaqen mesazhet e Supabase) */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-[100]">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-slate-800">Njoftimet</h3>
                <span className="text-xs text-slate-400">{unreadCount} të reja</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-xl text-sm border-l-4 border-red-500">
                      {n.message}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4 italic">Nuk ka njoftime të reja</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* IKONAT TJERA */}
        <Settings size={20} className="text-slate-400 cursor-pointer hover:text-slate-600" />
        <HelpCircle size={20} className="text-slate-400 cursor-pointer hover:text-slate-600" />
        
        {/* PROFILE */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 ml-2 cursor-pointer group">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-black italic shadow-sm group-hover:scale-105 transition-all">
            DB
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-black text-gray-800 italic uppercase tracking-tighter leading-none">Dion Beqiri</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}