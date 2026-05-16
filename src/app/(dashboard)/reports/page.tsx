"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, Variants } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Printer, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from "../../../context/LanguageContext";

export default function ReportsPage() {
  // 1. Përdorim vetëm 't' dhe 'language' nga Context-i
  const { t, language } = useLanguage();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

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

  const { chartData, totals } = useMemo(() => {
    let hyrjeTotale = 0;
    let daljeTotale = 0;
    const groupedData: Record<string, { name: string; hyrje: number; dalje: number }> = {};

    rawData.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-US', { day: '2-digit', month: 'short' });
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
  }, [rawData, language]);

  const handlePrint = () => window.print();

  const handleGenerateAISuggestion = async () => {
    if (rawData.length === 0) return;
    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const response = await fetch('/api/ai/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: JSON.stringify({ totals, periudha: `${startDate} - ${endDate}` }), 
          type: 'prediction' 
        }),
      });
      const aiData = await response.json();
      setAiSuggestion(aiData.recommendation || aiData.message || "Analiza u krye.");
    } catch (error) {
      setAiSuggestion("Gabim gjatë lidhjes me AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 bg-[#fafafa] gap-8 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
          {t('title')}
        </h1>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg">
          <Printer size={16} /> {t('print')}
        </button>
      </div>

      {/* Seksioni i AI */}
      <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden no-print">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <div className="p-4 md:p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">{t('aiPredictor')}</h2>
          </div>
          <div className="text-center">
            {isAiLoading ? (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('loadingText')}</p>
            ) : (
              <p className="text-sm font-bold text-slate-700 italic">
                {aiSuggestion || (rawData.length === 0 ? t('noData') : t('ready'))}
              </p>
            )}
          </div>
          <button 
            onClick={handleGenerateAISuggestion}
            disabled={isAiLoading || rawData.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${rawData.length === 0 ? "bg-slate-50 text-slate-300" : "bg-slate-900 text-white hover:bg-red-600 shadow-lg"}`}
          >
            <Sparkles size={14} className={isAiLoading ? "animate-spin" : ""} />
            {t('generateBtn')}
          </button>
        </div>
      </div>

      {/* Kalendari dhe Totale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-6 no-print">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('startDate')}</label>
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl px-4 py-3 font-bold" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('endDate')}</label>
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl px-4 py-3 font-bold" />
          </div>
        </div>

        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <ArrowUpRight size={32} className="text-green-600" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('totalIn')}</p>
              <h3 className="text-3xl font-black italic text-slate-900">
                {isLoading ? '...' : totals.hyrje.toLocaleString()} <span className="text-sm text-slate-300 font-bold uppercase">{t('units')}</span>
              </h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <ArrowDownRight size={32} className="text-red-600" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('totalOut')}</p>
              <h3 className="text-3xl font-black italic text-slate-900">
                {isLoading ? '...' : totals.dalje.toLocaleString()} <span className="text-sm text-slate-300 font-bold uppercase">{t('units')}</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Grafiku */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[450px]">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-8">{t('chartTitle')}</h2>
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold italic uppercase tracking-widest">{t('loading')}</div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold italic uppercase">{t('no_data')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Legend iconType="circle" />
                <Bar dataKey="hyrje" name={language === 'sq' ? "Hyrje" : "Stock In"} fill="#0f172a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dalje" name={language === 'sq' ? "Dalje" : "Stock Out"} fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}