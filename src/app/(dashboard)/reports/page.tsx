"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, Variants } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Printer, Sparkles, Calendar, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
  // 1. State për Kalendarin
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 2. State për të dhënat
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // 3. Marrja e të dhënave nga Supabase
  useEffect(() => {
    const fetchRealData = async () => {
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
          .from('inventory_logs') 
          .select('created_at, action_type, quantity_change')
          .eq('admin_id', targetAdminId)
          .gte('created_at', `${startDate}T00:00:00Z`)
          .lte('created_at', `${endDate}T23:59:59Z`);

        if (error) throw error;
        setRawData(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, [supabase, startDate, endDate]);

  // 4. Procesimi i të dhënave për grafikun
  const { chartData, totals } = useMemo(() => {
    let hyrjeTotale = 0;
    let daljeTotale = 0;
    const groupedData: Record<string, { name: string; hyrje: number; dalje: number }> = {};

    rawData.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString('sq-AL', { day: '2-digit', month: 'short' });
      if (!groupedData[date]) {
        groupedData[date] = { name: date, hyrje: 0, dalje: 0 };
      }
      if (log.action_type === 'in') {
        groupedData[date].hyrje += Number(log.quantity_change);
        hyrjeTotale += Number(log.quantity_change);
      } else {
        groupedData[date].dalje += Number(log.quantity_change);
        daljeTotale += Number(log.quantity_change);
      }
    });

    return {
      chartData: Object.values(groupedData),
      totals: { hyrje: hyrjeTotale, dalje: daljeTotale }
    };
  }, [rawData]);

  const handlePrint = () => window.print();

  const handleGenerateAISuggestion = async () => {
    if (rawData.length === 0) return;
    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const reportData = JSON.stringify({
        periudha: `Nga ${startDate} deri ${endDate}`,
        hyrjet_totale: totals.hyrje,
        daljet_totale: totals.dalje,
      });

      const response = await fetch('/api/ai/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reportData, type: 'prediction' }),
      });

      const aiData = await response.json();
      setAiSuggestion(aiData.recommendation || aiData.message || "Analiza u krye me sukses.");
    } catch (error) {
      setAiSuggestion("Ndodhi një gabim gjatë lidhjes me AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 bg-[#fafafa] gap-8 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center no-print">
        <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
          REPORTS <span className="text-red-600">ANALYTICS</span>
        </h1>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <Printer size={16} /> Print Report
        </button>
      </motion.div>

      {/* Seksioni i AI - I rregulluar që të mos zhduket */}
      {/* Seksioni i AI - Kompakt dhe Dinamik */}
<motion.div 
  initial={{ opacity: 0, y: -10 }} 
  animate={{ opacity: 1, y: 0 }} 
  className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden no-print"
>
  {/* Vija dekorative anësore më e hollë */}
  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
  
  <div className="p-4 md:p-6 flex flex-col items-center gap-4">
    
    {/* Header i vogël */}
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-blue-50 rounded-xl text-blue-600">
        <Sparkles size={16} strokeWidth={2.5} />
      </div>
      <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">
        AI Predictor
      </h2>
    </div>

    {/* Teksti - Madhësi mesatare dhe auto-expand */}
    <div className="max-w-3xl w-full flex items-center justify-center">
      {isAiLoading ? (
        <div className="flex items-center gap-3 py-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>
          <p className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">Duke analizuar...</p>
        </div>
      ) : (
        <p className="text-sm md:text-base font-bold text-slate-700 leading-snug italic text-center px-2">
          {aiSuggestion || (rawData.length === 0 
            ? "Zgjidhni një periudhë me lëvizje për analizë." 
            : "Gati për analizë të dhënash.")}
        </p>
      )}
    </div>

    {/* Butoni më i vogël dhe elegant */}
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={handleGenerateAISuggestion}
        disabled={isAiLoading || rawData.length === 0}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300
          ${rawData.length === 0 
            ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100" 
            : "bg-slate-900 text-white hover:bg-red-600 shadow-lg shadow-slate-200"}
        `}
      >
        <Sparkles size={14} className={isAiLoading ? "animate-spin" : ""} />
        {isAiLoading ? "Duke procesuar..." : "Analizo Stokun"}
      </button>
      
      {rawData.length === 0 && !isAiLoading && (
        <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">
          Nuk u gjetën të dhëna
        </span>
      )}
    </div>
  </div>
</motion.div>

      {/* Kalendari dhe Totale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-6 no-print">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900/5 font-bold" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900/5 font-bold" />
          </div>
        </div>

        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 relative group">
            <div className="bg-green-50 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
              <ArrowUpRight size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Hyrje</p>
              <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                {isLoading ? '...' : totals.hyrje.toLocaleString()} <span className="text-sm text-slate-300 font-bold tracking-normal uppercase">Units</span>
              </h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 relative group">
            <div className="bg-red-50 text-red-600 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
              <ArrowDownRight size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Dalje</p>
              <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                {isLoading ? '...' : totals.dalje.toLocaleString()} <span className="text-sm text-slate-300 font-bold tracking-normal uppercase">Units</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Grafiku */}
      <motion.div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[450px]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Inventory Flow Timeline</h2>
        </div>
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold italic uppercase tracking-widest">Loading Data...</div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold italic uppercase">No data found for the selected range.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Bar dataKey="hyrje" name="Stock In" fill="#0f172a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dalje" name="Stock Out" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @media print {
          .no-print { display: none !important; }
          .print-container { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}