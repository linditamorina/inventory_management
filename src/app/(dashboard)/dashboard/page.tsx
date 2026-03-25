'use client';
import { Package, AlertCircle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Items', value: '248', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low Stock', value: '12', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Inventory Value', value: '€14,250', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Users', value: '4', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={26} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{stat.value}</h3>
              <span className="text-green-500 text-[10px] font-bold flex items-center"><ArrowUpRight size={10}/> 5%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}