'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, HelpCircle, X } from 'lucide-react'; 
import { useNotifications } from '../../hooks/useNotification';

export default function Navbar() {
  const { notifications, unreadCount, deleteNotification, markAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Referenca për të detektuar klikimin jashtë dropdown-it
  const dropdownRef = useRef<HTMLDivElement>(null);

  // LOGJIKA PËR MBYLLJEN KUR KLIKON JASHTË
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 relative z-[50]">
      
      {/* PJESA E MAJTË */}
      <div className="flex-1">
        <h2 className="text-sm font-black text-slate-400 italic uppercase tracking-[0.2em]">
          Inventory <span className="text-slate-900">Management</span>
        </h2>
      </div>

      {/* PJESA E DJATHTË */}
      <div className="flex items-center gap-2">
        
        {/* CONTAINER I NJOFTIMEVE */}
        <div className="relative" ref={dropdownRef}>
          {/* BUTONI ZILJA */}
          <div 
            className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all relative"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Bell size={20} className={`transition-colors ${isDropdownOpen ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`} />
            
            {/* PIKA E KUQE E NJOFTIMEVE */}
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white animate-pulse shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
          
          {/* DROPDOWN KUTIA E NJOFTIMEVE */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-80 bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-6 z-[100] animate-in fade-in zoom-in duration-200">
              
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                <h3 className="font-black italic text-slate-800 uppercase text-xs tracking-tighter">Njoftimet</h3>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} TË REJA</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      className={`relative group/item p-3 rounded-2xl text-[11px] font-bold cursor-pointer transition-all border-l-4 
                        ${n.is_read ? 'bg-white text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-red-500 hover:bg-slate-100'}`}
                      onClick={() => markAsRead(n.id)} // KJO E SHËNON SI TË LEXUAR (HEQ PIKËN E KUQE)
                    >
                      <div className="pr-6 leading-relaxed">
                        {n.message}
                      </div>

                      {/* BUTONI X PËR TË FSHIRË NJOFTIMIN */}
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Ndalon klikimin e kutisë që mos të bëhet "markAsRead" kur fshijmë
                          deleteNotification(n.id);
                        }}
                        className="absolute right-2 top-3 p-1 hover:bg-red-100 rounded-full text-slate-300 hover:text-red-600 transition-all z-[110]"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-6 italic text-xs font-medium">Nuk ka njoftime të reja</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SETTINGS (E PAPREKUR) */}
        <div className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-400 hover:text-slate-900 transition-all">
          <Settings size={20} />
        </div>
        
        {/* HELP (E PAPREKUR) */}
        <div className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-400 hover:text-slate-900 transition-all">
          <HelpCircle size={20} />
        </div>
        
        {/* PROFILE (E PAPREKUR) */}
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