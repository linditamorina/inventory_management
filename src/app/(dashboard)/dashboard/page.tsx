'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, AlertCircle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  // 1. Krijojmë State për të mbajtur numrat realë
  const [data, setData] = useState({
    totalItems: 0,
    lowStock: 0,
    inventoryValue: 0,
    activeUsers: 1 // Ky mbetet statik 1 për momentin derisa të kemi tabelën e përdoruesve
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. Funksioni që merr të dhënat nga Supabase kur hapet faqja
  useEffect(() => {
    const fetchStats = async () => {
      // KUJDES: Këtu po supozoj që tabela quhet 'products'
      // dhe kolonat quhen 'quantity' dhe 'price'
      const { data: products, error } = await supabase
        .from('products')
        .select('quantity, price');

      if (products && !error) {
        // Llogarisim totalin e produkteve
        const total = products.length;
        
        // Llogarisim produktet që kanë sasi nën 5
        const low = products.filter(p => p.quantity < 5).length;
        
        // Llogarisim vlerën totale (çmim * sasi për çdo produkt)
        const value = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

        setData({
          totalItems: total,
          lowStock: low,
          inventoryValue: value,
          activeUsers: 1
        });
      }
    };

    fetchStats();
  }, [supabase]);

  // 3. Përditësojmë array-n e stats me vlerat nga State (data)
  const stats = [
    { label: 'Total Items', value: data.totalItems.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low Stock', value: data.lowStock.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Inventory Value', value: `€${data.inventoryValue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Users', value: data.activeUsers.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    // Këtu shtova 'max-w-7xl mx-auto' për të rregulluar gjerësinë (zoom-in)
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={26} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{stat.value}</h3>
              {/* Elementi +5% e lashë statik për dizajn, por mund ta bëjmë dinamik më vonë */}
              <span className="text-green-500 text-[10px] font-bold flex items-center"><ArrowUpRight size={10}/> 5%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}