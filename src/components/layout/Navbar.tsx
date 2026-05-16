'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, ShieldCheck, LogOut, ChevronRight, Key, Building, Languages, Trash2, CheckCircle2 } from 'lucide-react'; 
import { useNotifications } from '../../hooks/useNotification';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

export default function Navbar() {
  const { notifications, unreadCount, deleteNotification, markAsRead, markAllAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const { t, language, setLanguage } = useLanguage();
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

  // LOGJIKA E RE: Shëno si të lexuara VETËM kur mbyllet dritarja
  const prevDropdownState = useRef(isDropdownOpen);
  useEffect(() => {
    // Nëse dritarja ishte e hapur (true) dhe tani po mbyllet (false)
    if (prevDropdownState.current === true && isDropdownOpen === false) {
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
    // Ruajmë gjendjen aktuale për herën tjetër
    prevDropdownState.current = isDropdownOpen;
  }, [isDropdownOpen, unreadCount, markAllAsRead]);

  // Tani ky funksion vetëm hap dhe mbyll dritaren, nuk fshin numrin direkt
  const handleToggleNotifications = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sq' : 'en');
  };

  const userFullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('loading');
  const userEmail = user?.email || 'pa email';
  
  const getInitials = (name: string) => {
    if (!name || name === t('loading')) return '...';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 relative z-[50]">
      <div className="flex-1">
        <h2 className="text-sm font-black text-slate-400 italic uppercase tracking-[0.2em]">
          {t('navbar_inventory')} <span className="text-slate-900">{t('navbar_management')}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* NJOFTIMET */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all relative" 
            onClick={handleToggleNotifications}
          >
            <Bell size={20} className={`transition-colors ${isDropdownOpen ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-[350px] bg-white border border-slate-100 shadow-2xl rounded-[2rem] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-6 border-b border-slate-50 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 italic">Njoftimet</h3>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg uppercase tracking-tighter">
                      {unreadCount} të reja
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-2 bg-slate-50/30">
                {notifications.length > 0 ? (
                  notifications.map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={`group relative p-4 rounded-[1.5rem] mb-1 transition-all flex gap-3 border ${!notification.is_read ? 'bg-white border-red-50 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-100'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${!notification.is_read ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-slate-100 text-slate-400'}`}>
                        <Bell size={14} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] leading-relaxed mb-1 ${!notification.is_read ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                          {notification.message}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {!notification.is_read && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              markAsRead(notification.id);
                            }}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); 
                            deleteNotification(notification.id);
                          }}
                          className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-widest">Nuk ka njoftime</p>
                  </div>
                )}
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
                <ShieldCheck size={10} className="text-red-600" /> {userRole === 'admin' ? t('role_admin') : t('role_staff')}
              </span>
            </div>
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black italic shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-all border-2 border-white">
              {getInitials(userFullName)}
            </div>
          </div>

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
                <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                      <Languages size={16} />
                    </div>
                    <span className="text-[11px] font-black uppercase text-slate-600 italic">
                      {language === 'en' ? 'Shqip (SQ)' : 'English (EN)'}
                    </span>
                  </div>
                  <div className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-lg uppercase group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {language.toUpperCase()}
                  </div>
                </button>

                {/* {userRole === 'admin' && ( */}
                  {/* // <button onClick={() => { setIsProfileOpen(false); router.push('/dashboard/staff'); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group"> */}
                    {/* <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors"><User size={16} /></div>
                      <span className="text-[11px] font-black uppercase text-slate-600 italic">{t('manage_staff')}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" /> */}
                  {/* // </button> */}
                
                
                {/* Ndrysho Fjalëkalimin */}
                <button onClick={() => { setIsProfileOpen(false); router.push('/reset-password'); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                      <Key size={16} />
                    </div>
                    <span className="text-[11px] font-black uppercase text-slate-600 italic">
                      {t('change_password')}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button onClick={() => { setIsProfileOpen(false); router.push('/dashboard/about-company'); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors"><Building size={16} /></div>
                    <span className="text-[11px] font-black uppercase text-slate-600 italic">{t('about_company')}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-2xl transition-all group mt-2 border-t border-slate-50 pt-6">
                  <div className="p-2 bg-red-100 rounded-xl text-red-600"><LogOut size={16} /></div>
                  <span className="text-[11px] font-black uppercase text-red-600 italic">{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}