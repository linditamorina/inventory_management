'use client';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion, Variants } from 'framer-motion'; 
import { useLanguage } from '../../../context/LanguageContext';
import { useAboutCompany } from '../../../hooks/useAboutCompany';

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const { t, language } = useLanguage();
  
  // Marrja e Valutës nga të dhënat e kompanisë
  const { aboutCompany } = useAboutCompany();
  const [currencySymbol, setCurrencySymbol] = useState("€");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // Setimi i Valutës Dinamike sapo të ngarkohet profili i kompanisë
  useEffect(() => {
    if (aboutCompany?.currency) {
      const c = aboutCompany.currency.toUpperCase();
      if (c === 'USD') setCurrencySymbol('$');
      else if (c === 'EUR') setCurrencySymbol('€');
      else if (c === 'ALL') setCurrencySymbol('L');
      else if (c === 'GBP') setCurrencySymbol('£');
      else setCurrencySymbol(aboutCompany.currency);
    }
  }, [aboutCompany]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, admin_id')
          .eq('id', user.id)
          .single();

        let targetAdminId = user.id;
        if (profile && profile.role === 'staff' && profile.admin_id) {
          targetAdminId = profile.admin_id;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('admin_id', targetAdminId);

        if (data && !error) setProducts(data);

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', targetAdminId);

      if (usersCount !== null) setActiveUsersCount(usersCount);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [supabase]);

  const statsData = useMemo(() => {
    const total = products.length;
    const low = products.filter(p => Number(p.quantity || 0) < Number(p.min_stock_level || 5)).length;
    const value = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0);
    const categoryMap = products.reduce((acc: any, p) => {
      const catName = p.category ? String(p.category).toUpperCase() : (language === 'en' ? 'OTHER' : 'TJERA');
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});
    return { 
      total, low, value, 
      areaData: Object.keys(categoryMap).map(key => ({ name: key, total: categoryMap[key] })),
      pieData: [
        { name: language === 'en' ? 'In Stock' : 'Në Gjendje', value: total - low, color: '#0f172a' },
        { name: language === 'en' ? 'Low' : 'Ulët', value: low, color: '#ef4444' },
      ].filter(d => d.value > 0 || total === 0)
    };
  }, [products, language]);

  // Formatimi i vlerës financiare me 2 shifra dhjetore për t'u dukur profesional
  const formattedValue = statsData.value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const active_users = activeUsersCount;

  const stats = [
    { label: t('total_items'), value: statsData.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('low_stock'), value: statsData.low, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { 
      label: t('inventory_value'), 
      value: `${currencySymbol}${formattedValue}`, // Këtu përdoret valuta!
      icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' 
    },
    { label: t('active_users'), value: `${active_users}`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 bg-[#fafafa] overflow-hidden gap-6 overflow-y-auto custom-scrollbar">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
          {t('dashboard_title')} <span className="text-red-600">{t('dashboard_overview')}</span>
        </h1>
      </motion.div>

      {/* Rreshti i Kartave i Rregulluar për numra të mëdhenj */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-shrink-0">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 relative group cursor-default">
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:rotate-12`}>
              <stat.icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 italic">{stat.label}</p>
              {/* E hoqa 'truncate' dhe i dhashë një style për 'break-word' që të mbajë gjatësinë */}
              <h3 className="text-lg lg:text-xl xl:text-2xl font-black italic tracking-tighter text-slate-900 leading-none" style={{ wordBreak: 'break-word' }}>
                {isLoading ? '...' : stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="lg:col-span-2 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
          <h2 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{t('products_by_category')}</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData.areaData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[300px] relative">
          <h2 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">{t('stock_status')}</h2>
          <div className="flex-1 w-full relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statsData.pieData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                  {statsData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '12px', fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[42%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-center pointer-events-none">
              <span className="block text-2xl font-black italic text-slate-900 leading-none">{statsData.total}</span>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Total</p>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}