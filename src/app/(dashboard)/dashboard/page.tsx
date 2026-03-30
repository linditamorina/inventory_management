'use client';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, AlertCircle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
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

  // --- LOGJIKA E TË DHËNAVE ---
  const statsData = useMemo(() => {
    const total = products.length;
    const low = products.filter(p => Number(p.quantity) < 5).length;
    const value = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);

    const categoryMap = products.reduce((acc: any, p) => {
      // Bëjmë emrin e kategorisë Uppercase këtu në logjikë
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
    { label: 'Total Items', value: statsData.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', isPositive: true },
    { label: 'Low Stock', value: statsData.low, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: statsData.low > 0 ? 'KUJDES' : 'OK', isPositive: false },
    { label: 'Inventory Value', value: `€${statsData.value.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', trend: '+8%', isPositive: true },
    { label: 'Active Users', value: 1, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'LIVE', isPositive: true },
  ];

  return (
    <div className="w-full px-8 space-y-10 py-4">
      {/* Header */}
      <div className="ml-1">
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
          Dashboard <span className="text-red-600">Overview</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Analiza në kohë reale</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
              <stat.icon size={26} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic relative z-10">{stat.label}</p>
            <div className="flex items-baseline gap-2 relative z-10">
              <h3 className={`text-3xl font-black italic tracking-tighter ${isLoading ? 'text-slate-200 animate-pulse' : 'text-slate-900'}`}>
                {isLoading ? '---' : stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h2 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase mb-8">Produktet sipas Kategorisë</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" fill="#0f172a" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase mb-8 text-center">Statusi i Stokut</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statsData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}