'use client';

import React, { useState } from 'react';
import { Bell, Settings, HelpCircle } from 'lucide-react'; 
import { useNotifications } from '../../hooks/useNotification';

export default function Navbar() {
  const { notifications, unreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 relative z-[50]">
      
      {/* PJESA E MAJTË */}
      <div className="flex-1">
        <h2 className="text-sm font-black text-slate-400 italic uppercase tracking-[0.2em]">
          Inventory <span className="text-slate-900">Management</span>
        </h2>
      </div>

      {/* PJESA E DJATHTË - Ikonat e kontrollit */}
      <div className="flex items-center gap-2">
        
        {/* BUTONI I NJOFTIMEVE (ZILJA) */}
        <div className="relative p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <Bell size={20} className="text-slate-400 group-hover:text-red-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-80 bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-6 z-[100]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                <h3 className="font-black italic text-slate-800 uppercase text-xs tracking-tighter">Njoftimet</h3>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} TË REJA</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-600 border-l-4 border-red-500">
                      {n.message}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4 italic text-xs font-medium">Nuk ka njoftime të reja</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SETTINGS */}
        <div className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-400 hover:text-slate-900 transition-all">
          <Settings size={20} />
        </div>
        
        {/* HELP (VETËM NJË HERË) */}
        <div className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-400 hover:text-slate-900 transition-all">
          <HelpCircle size={20} />
        </div>
        
        {/* PROFILE */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100 ml-2 cursor-pointer group">
          <div className="flex flex-col items-end hidden lg:flex">
            <span className="text-xs font-black text-slate-900 italic uppercase tracking-tighter leading-none group-hover:text-red-600 transition-colors">Dion Beqiri</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Admin</span>
          </div>
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black italic shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-all border-2 border-white">
            DB
          </div>
        </div>

      </div>
    </header>
  );
}