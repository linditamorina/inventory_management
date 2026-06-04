'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Tag, 
  Users,
  FileText,
  History   
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Të gjitha menutë e sistemit të përfshira këtu
  const menuItems = [
    { icon: LayoutDashboard, label: 'sidebar_dashboard', path: '/dashboard' },
    { icon: Package, label: 'sidebar_inventory', path: '/inventory' },
    { icon: Tag, label: 'sidebar_categories', path: '/categories' },
    { icon: Users, label: 'sidebar_staff', path: '/dashboard/staff' }, 
    { icon: FileText, label: 'sidebar_invoices', path: '/invoices' }, 
    { icon: History, label: 'sidebar_invoices_history', path: '/invoices/history' }, 
    { icon: BarChart3, label: 'sidebar_reports', path: '/reports' },
  ];

  return (
    <aside className="w-64 bg-[#1a1c1e] text-gray-400 flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-red-600 p-2 rounded-lg">
          <Package size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight">
          {t('sidebar_app_name') || 'INVENTORY'}
        </span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          
          // Logjika mbrojtëse për të shfaqur emrat në Shqip nëse mungojnë përkthimet json
          let translatedLabel = t(item.label);
          if (!translatedLabel || translatedLabel === item.label) {
            if (item.label === 'sidebar_dashboard') translatedLabel = 'Dashboard';
            if (item.label === 'sidebar_inventory') translatedLabel = 'Inventory';
            if (item.label === 'sidebar_categories') translatedLabel = 'Categories';
            if (item.label === 'sidebar_staff') translatedLabel = 'Staff';
            if (item.label === 'sidebar_reports') translatedLabel = 'Reports';
            if (item.label === 'sidebar_invoices') translatedLabel = 'Faturë e Re';
            if (item.label === 'sidebar_invoice_history') translatedLabel = 'Historiku i Faturave';
          }

          return (
            <Link 
              href={item.path} 
              key={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{translatedLabel}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}