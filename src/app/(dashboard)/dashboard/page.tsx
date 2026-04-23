'use client';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (data && !error) setProducts(data);
      } catch (err) {
        console.error("Gabim në marrjen e të dhënave:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [supabase]);

  const statsData = useMemo(() => {
    const total = products.length;
    const low = products.filter(p => Number(p.quantity) < 5).length;
    const value = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
    const categoryMap = products.reduce((acc: any, p) => {
      const catName = p.category ? p.category.toUpperCase() : 'PA KATEGORI';
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});
    const barData = Object.keys(categoryMap).map(key => ({ name: key, total: categoryMap[key] }));
    const pieData = [
      { name: 'NË RREGULL', value: total - low, color: '#10b981' },
      { name: 'STOK I ULËT', value: low, color: '#ef4444' },
    ];
    return { total, low, value, barData, pieData };
  }, [products]);

  const stats = [
    { label: 'Total Items', value: statsData.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low Stock', value: statsData.low, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Inventory Value', value: `€${statsData.value.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Users', value: 1, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    /* NDRYSHIMI: h-full dhe max-h-full për t'u përshtatur brenda layout-it prind */
    <div className="w-full h-full max-h-full px-8 py-6 flex flex-col gap-6 overflow-hidden bg-white">
      
      {/* Header */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
          Dashboard <span className="text-red-600">Overview</span>
        </h1>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] italic mt-1">Analiza në kohë reale</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
              <stat.icon size={18} strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic relative z-10">{stat.label}</p>
            <h3 className={`text-2xl font-black italic tracking-tighter ${isLoading ? 'text-slate-200 animate-pulse' : 'text-slate-900'}`}>
              {isLoading ? '---' : stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* CHART SECTION - flex-1 detyron grafikët të zënë vetëm hapësirën e mbetur */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-0">
          <h2 className="text-base font-black italic tracking-tighter text-slate-900 uppercase mb-4 flex-shrink-0">Produktet sipas Kategorisë</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: '900' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }} />
                <Bar dataKey="total" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-0">
          <h2 className="text-base font-black italic tracking-tighter text-slate-900 uppercase mb-4 text-center flex-shrink-0">Statusi i Stokut</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsData.pieData}
                  cx="50%" cy="45%"
                  innerRadius="60%" outerRadius="85%"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statsData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '9px', fontWeight: '900' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}