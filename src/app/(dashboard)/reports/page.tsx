"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Download, Sparkles, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Zap, Target, BarChart2, Lightbulb, ShieldAlert,
  ChevronDown, ChevronUp, Loader2, Package, Star, History, Save, X, Trash2,
  FileText, RefreshCw
} from 'lucide-react';
import { useLanguage } from "../../../context/LanguageContext";
import { useAboutCompany } from "../../../hooks/useAboutCompany";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const translations = {
  en: {
    title: "Reports & Analytics",
    downloadPDF: "Download PDF",
    generateBtn: "Generate Profitability Analysis",
    generating: "Analyzing...",
    startDate: "Start Date", endDate: "End Date",
    totalIn: "Total In", totalOut: "Total Out", units: "units",
    chartTitle: "Stock Movement Overview",
    loading: "Loading...", no_data: "No movements found.",
    noDataAlert: "No movement data found for this period. Adjust the date range.",
    summary: "Executive Summary", health: "Inventory Health",
    topProfit: "Top 3 Profitable", worstPerf: "Top 3 Worst",
    highProfit: "High Profit Products", avgProfit: "Average / Stable",
    lossMakers: "Loss Makers / Dead Stock", highPotential: "High Potential",
    scaleUp: "Scale Up", reduce: "Reduce / Eliminate", testOptimize: "Test & Optimize",
    general: "General Optimization", stockStrategy: "Stock Strategy",
    marginIdeas: "Margin Ideas", mainRisk: "Main Risk", kpis: "KPIs to Monitor",
    revenue: "Revenue", units_sold: "Units Sold", margin: "Margin",
    stock_val: "Stock Value", action: "Action", strategy: "Strategy",
    why: "Why", how: "How to Maximize", expectedImpact: "Expected Impact",
    readyMsg: "Click Generate to get a full profitability analysis powered by AI.",
    langChanged: "Language changed. Please regenerate the analysis.",
    // History
    historyTitle: "Report History",
    historyEmpty: "No saved reports yet.",
    historyPeriod: "Period",
    historyHealth: "Health",
    historyRevenue: "Revenue",
    historyProducts: "Products",
    historyDate: "Saved On",
    historyDownload: "Download",
    historyDelete: "Delete",
    // Save modal
    saveModalTitle: "Save this report?",
    saveModalDesc: "The report will be saved to your history so you can access it later.",
    saveAndDownload: "Yes, Save & Download",
    onlyDownload: "No, just Download",
    saving: "Saving...",
  },
  sq: {
    title: "Raportet & Analitika",
    downloadPDF: "Shkarko PDF",
    generateBtn: "Gjenero Analizën e Profitabilitetit",
    generating: "Duke analizuar...",
    startDate: "Data Fillestare", endDate: "Data Përfundimtare",
    totalIn: "Hyrje Totale", totalOut: "Dalje Totale", units: "CP",
    chartTitle: "Pasqyra e Lëvizjeve të Stokut",
    loading: "Duke ngarkuar...", no_data: "Nuk u gjetën lëvizje.",
    noDataAlert: "Nuk ka të dhëna lëvizjesh për këtë periudhë. Ndrysho intervalin e datave.",
    summary: "Summary Ekzekutiv", health: "Shëndeti i Inventarit",
    topProfit: "Top 3 Fitimprurëse", worstPerf: "Top 3 Problematike",
    highProfit: "Produkte me Fitim të Lartë", avgProfit: "Fitim Mesatar / Stabil",
    lossMakers: "Humbje / Dead Stock", highPotential: "Potencial i Lartë",
    scaleUp: "Rrit Sasinë", reduce: "Redukto / Elimino", testOptimize: "Testo & Optimizo",
    general: "Optimizim i Përgjithshëm", stockStrategy: "Strategji Stoku",
    marginIdeas: "Ide për Marzhë", mainRisk: "Rreziku Kryesor", kpis: "KPI-t për Monitorim",
    revenue: "Të Ardhura", units_sold: "Njësi Shitura", margin: "Marzha",
    stock_val: "Vlera Stoku", action: "Veprimi", strategy: "Strategjia",
    why: "Pse", how: "Si të Maksimizosh", expectedImpact: "Impakti i Pritur",
    readyMsg: "Kliko Gjenero për analizë të plotë profitabiliteti me AI.",
    langChanged: "Gjuha u ndryshua. Ju lutemi rigjeneroni analizën.",
    // History
    historyTitle: "Historiku i Raporteve",
    historyEmpty: "Nuk ka raporte të ruajtura ende.",
    historyPeriod: "Periudha",
    historyHealth: "Shëndeti",
    historyRevenue: "Të Ardhura",
    historyProducts: "Produkte",
    historyDate: "Ruajtur Më",
    historyDownload: "Shkarko",
    historyDelete: "Fshi",
    // Save modal
    saveModalTitle: "Ruaj këtë raport?",
    saveModalDesc: "Raporti do të ruhet në historik dhe mund ta aksesosh kur të duash.",
    saveAndDownload: "Po, Ruaj & Shkarko",
    onlyDownload: "Jo, vetëm Shkarko",
    saving: "Duke ruajtur...",
  }
};

const HEALTH_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  'Healthy':            { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={18} />, label: 'Healthy' },
  'Needs Improvement':  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: <AlertTriangle size={18} />, label: 'Needs Improvement' },
  'Critical':           { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     icon: <ShieldAlert size={18} />, label: 'Critical' },
};

function SectionCard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-6 py-4 border-l-4 ${color}`}>
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-black uppercase tracking-tight text-sm text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${color}`}>{text}</span>;
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.sq;
  const { aboutCompany } = useAboutCompany();
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("€");

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [langChanged, setLangChanged] = useState(false);
  const prevLang = React.useRef(language);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // Kontrollo rolin — vetëm admin mund të hyjë
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => {
            if (data?.role !== 'admin') {
              router.replace('/dashboard');
            } else {
              setAccessChecked(true);
            }
          });
      } else {
        router.replace('/dashboard');
      }
    });
  }, [supabase, router]);

  useEffect(() => {
    if (aboutCompany?.currency) {
      const c = aboutCompany.currency.toUpperCase();
      setCurrencySymbol(c === 'USD' ? '$' : c === 'GBP' ? '£' : c === 'ALL' ? 'L' : '€');
    }
  }, [aboutCompany]);

  // Kur ndryshon gjuha, pastro analizën e vjetër
  useEffect(() => {
    if (prevLang.current !== language) {
      prevLang.current = language;
      if (analysis) {
        setAnalysis(null);
        setLangChanged(true);
      }
    }
  }, [language, analysis]);

  // Ngarko historikun e raporteve
  const loadHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('report_history')
        .select('*')
        .eq('admin_id', user.id)
        .order('created_at', { ascending: false });
      setHistoryRecords(data || []);
    } catch { setHistoryRecords([]); }
    finally { setIsLoadingHistory(false); }
  }, [supabase]);

  useEffect(() => {
    if (accessChecked) loadHistory();
  }, [accessChecked, loadHistory]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        // Gjej admin_id-in korrekt (admin → user.id, staff → admin_id nga profili)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setRawData([]); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, admin_id')
          .eq('id', user.id)
          .single();

        const targetAdminId =
          profile?.role === 'staff' && profile?.admin_id
            ? profile.admin_id
            : user.id;

        // Merr vetëm product IDs që i përkasin këtij admin
        const { data: adminProducts } = await supabase
          .from('products')
          .select('id')
          .eq('admin_id', targetAdminId);

        const productIds = (adminProducts || []).map((p: any) => p.id);

        // Nëse nuk ka produkte, kthe bosh
        if (productIds.length === 0) {
          setRawData([]);
          setAnalysis(null);
          return;
        }

        const { data, error } = await supabase
          .from('stock_movements')
          .select('created_at, type, quantity, product_id, products (name, sku, category, price, quantity)')
          .in('product_id', productIds)
          .gte('created_at', `${startDate}T00:00:00Z`)
          .lte('created_at', `${endDate}T23:59:59Z`);

        if (error) throw error;
        setRawData(data || []);
        setAnalysis(null);
      } catch { setRawData([]); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [supabase, startDate, endDate]);

  const { chartData, totals } = useMemo(() => {
    let hyrjeTotale = 0, daljeTotale = 0;
    const grouped: Record<string, { name: string; hyrje: number; dalje: number }> = {};
    rawData.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-US', { day: '2-digit', month: 'short' });
      if (!grouped[date]) grouped[date] = { name: date, hyrje: 0, dalje: 0 };
      if (log.type?.toUpperCase() === 'IN') { grouped[date].hyrje += Number(log.quantity); hyrjeTotale += Number(log.quantity); }
      else if (log.type?.toUpperCase() === 'OUT') { grouped[date].dalje += Number(log.quantity); daljeTotale += Number(log.quantity); }
    });
    return { chartData: Object.values(grouped), totals: { hyrje: hyrjeTotale, dalje: daljeTotale } };
  }, [rawData, language]);

  const productMovementsSummary = useMemo(() => {
    const summary: Record<string, any> = {};
    rawData.forEach(log => {
      const prod = Array.isArray(log.products) ? log.products[0] : log.products;
      if (!prod) return;
      const pId = log.product_id;
      if (!summary[pId]) summary[pId] = { sku: prod.sku || 'N/A', name: prod.name || 'Unknown', category: prod.category || 'N/A', price: Number(prod.price || 0), stok: Number(prod.quantity || 0), hyrje: 0, dalje: 0 };
      if (log.type?.toUpperCase() === 'IN') summary[pId].hyrje += Number(log.quantity || 0);
      else if (log.type?.toUpperCase() === 'OUT') summary[pId].dalje += Number(log.quantity || 0);
    });
    return Object.values(summary);
  }, [rawData]);

  const handleGenerateAnalysis = async () => {
    if (productMovementsSummary.length === 0) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalysis(null);
    setLangChanged(false);
    try {
      const res = await fetch('/api/ai/profitability-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productMovementsSummary,
          period: `${startDate} — ${endDate}`,
          currency: currencySymbol,
          language,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) {
      setAnalyzeError(e.message || 'Gabim gjatë analizës.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerDownload = () => {
    if (rawData.length > 0 || analysis) {
      setShowSaveModal(true);
    } else {
      executePDF();
    }
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const title = `${aboutCompany?.company_name || 'Raporti'} — ${new Date(startDate).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-US', { month: 'long', year: 'numeric' })}`;
      await supabase.from('report_history').insert({
        admin_id: user.id,
        title,
        period_start: startDate,
        period_end: endDate,
        health_status: analysis?.summary?.healthStatus || null,
        total_revenue: analysis?.summary?.totalRevenue || null,
        total_products: analysis?.summary?.totalProducts || productMovementsSummary.length,
        analysis_data: analysis || null,
      });
      await loadHistory();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const executePDF = (overrideAnalysis?: any) => {
    const usedAnalysis = overrideAnalysis !== undefined ? overrideAnalysis : analysis;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(aboutCompany?.company_name?.toUpperCase() || "EMRI I KOMPANISË", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(aboutCompany?.address || "Adresa e panjohur", 14, 30);
    doc.text(`Tel: ${aboutCompany?.phone || "-"} | Email: ${aboutCompany?.email || "-"}`, 14, 35);
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text("RAPORTI I INVENTARIT", pageWidth - 14, 22, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("PERIUDHA E AUDITIMIT", pageWidth - 14, 30, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.text(`${new Date(startDate).toLocaleDateString()}  -  ${new Date(endDate).toLocaleDateString()}`, pageWidth - 14, 35, { align: "right" });
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text(`Hyrje Totale: +${totals.hyrje.toLocaleString()} ${t.units}`, 14, 52);
    doc.setTextColor(220, 38, 38);
    doc.text(`Dalje Totale: -${totals.dalje.toLocaleString()} ${t.units}`, 80, 52);

    const tableColumn = ["SKU", "Emri Artikullit", "Kategoria", "Çmimi", "Hyrje (+)", "Dalje (-)", "Stoku Live"];
    const tableRows: any[] = productMovementsSummary.length === 0
      ? [["-", "Nuk ka lëvizje për këtë periudhë", "-", "-", "-", "-", "-"]]
      : productMovementsSummary.map(item => [
          item.sku, item.name, item.category,
          `${currencySymbol}${item.price.toFixed(2)}`,
          item.hyrje > 0 ? `+${item.hyrje}` : "0",
          item.dalje > 0 ? `-${item.dalje}` : "0",
          `${item.stok} CP`,
        ]);

    autoTable(doc, {
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'center', textColor: [22, 163, 74], fontStyle: 'bold' },
        5: { halign: 'center', textColor: [220, 38, 38], fontStyle: 'bold' },
        6: { halign: 'center', fontStyle: 'bold' },
      },
    });

    if (usedAnalysis?.summary) {
      const y = (doc as any).lastAutoTable.finalY + 14;
      doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY EKZEKUTIV (AI)', 14, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
      doc.text(`Shëndeti: ${usedAnalysis.summary.healthStatus} — ${usedAnalysis.summary.healthReason || ''}`, 14, y + 7);
      doc.text(`Të ardhura: ${usedAnalysis.summary.totalRevenue} | Vlera stoku: ${usedAnalysis.summary.totalStockValue}`, 14, y + 13);
    }

    const finalY2 = (doc as any).lastAutoTable.finalY + (usedAnalysis ? 30 : 10);
    doc.setDrawColor(226, 232, 240);
    doc.line(30, finalY2 + 40, 80, finalY2 + 40);
    doc.line(pageWidth - 80, finalY2 + 40, pageWidth - 30, finalY2 + 40);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text("Përgatiti (Stafi)", 55, finalY2 + 46, { align: "center" });
    doc.text("Aprovoi (Administratori)", pageWidth - 55, finalY2 + 46, { align: "center" });

    doc.save(`Raporti_${startDate}_${endDate}.pdf`);
  };

  const healthStyle = analysis?.summary?.healthStatus
    ? (HEALTH_STYLES[analysis.summary.healthStatus] || HEALTH_STYLES['Needs Improvement'])
    : null;

  if (!accessChecked) return null;

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 bg-[#fafafa] gap-6 overflow-y-auto">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 uppercase">{t.title}</h1>
        <button onClick={triggerDownload} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all active:scale-95">
          <Download size={16} strokeWidth={2.5} /> {t.downloadPDF}
        </button>
      </div>

      {/* Date filters + Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.startDate}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-400" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.endDate}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-400" />
          </div>
        </div>
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-3 bg-emerald-50 rounded-2xl"><ArrowUpRight size={24} className="text-emerald-600" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalIn}</p>
              <h3 className="text-3xl font-black text-slate-900">{isLoading ? '...' : totals.hyrje.toLocaleString()} <span className="text-sm text-slate-300 font-bold">{t.units}</span></h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-3 bg-red-50 rounded-2xl"><ArrowDownRight size={24} className="text-red-600" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalOut}</p>
              <h3 className="text-3xl font-black text-slate-900">{isLoading ? '...' : totals.dalje.toLocaleString()} <span className="text-sm text-slate-300 font-bold">{t.units}</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{t.chartTitle}</h2>
        <div style={{ height: 280 }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs tracking-widest">{t.loading}</div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs tracking-widest">{t.no_data}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend iconType="circle" />
                <Bar dataKey="hyrje" name={language === 'sq' ? 'Hyrje' : 'Stock In'} fill="#0f172a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dalje" name={language === 'sq' ? 'Dalje' : 'Stock Out'} fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Profitability Analysis */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* AI Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl"><Sparkles size={18} className="text-white" /></div>
            <div>
              <h2 className="text-white font-black uppercase tracking-tight text-sm">AI Profitability Analyst</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Powered by Llama 3.3 · 15+ year expertise simulation</p>
            </div>
          </div>
          <button
            onClick={handleGenerateAnalysis}
            disabled={isAnalyzing || productMovementsSummary.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-lg"
          >
            {isAnalyzing ? <><Loader2 size={14} className="animate-spin" />{t.generating}</> : <><Sparkles size={14} />{t.generateBtn}</>}
          </button>
        </div>

        <div className="p-6">
          {/* Language changed notice */}
          {langChanged && !analysis && !isAnalyzing && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <RefreshCw size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700">{t.langChanged}</p>
            </div>
          )}

          {/* Initial state */}
          {!analysis && !isAnalyzing && !analyzeError && (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-300">
              <BarChart2 size={40} strokeWidth={1} />
              <p className="font-bold text-sm text-center max-w-sm">{productMovementsSummary.length === 0 ? t.noDataAlert : t.readyMsg}</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center gap-4 text-slate-400">
              <Loader2 size={36} className="animate-spin text-blue-600" />
              <p className="font-black uppercase text-xs tracking-widest">{t.generating}</p>
              <p className="text-[10px] text-slate-300">{language === 'sq' ? 'Duke analizuar ' : 'Analyzing '}{productMovementsSummary.length}{language === 'sq' ? ' produkte...' : ' products...'}</p>
            </div>
          )}

          {analyzeError && (
            <div className="py-8 flex flex-col items-center gap-3">
              <AlertTriangle size={32} className="text-red-500" />
              <p className="font-bold text-red-600 text-sm">{analyzeError}</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-5">

              {/* ── 1. SUMMARY EKZEKUTIV ── */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-slate-300 inline-block" /> {t.summary}
                </h3>

                {/* Health Badge + Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {healthStyle && (
                    <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${healthStyle.bg} ${healthStyle.border}`}>
                      <div className={`flex items-center gap-2 ${healthStyle.text} font-black text-sm`}>
                        {healthStyle.icon} {t.health}
                      </div>
                      <p className={`font-black text-xl ${healthStyle.text}`}>{analysis.summary.healthStatus}</p>
                      <p className={`text-[10px] font-medium ${healthStyle.text} opacity-80`}>{analysis.summary.healthReason}</p>
                    </div>
                  )}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'sq' ? 'Të Ardhura Totale' : 'Total Revenue'}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{analysis.summary.totalRevenue}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{analysis.summary.totalProducts} {language === 'sq' ? 'produkte' : 'products'}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'sq' ? 'Vlera Stokut Aktual' : 'Current Stock Value'}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{analysis.summary.totalStockValue}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{language === 'sq' ? 'Inventar i mbetur' : 'Remaining inventory'}</p>
                  </div>
                </div>

                {/* Top 3 + Worst 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.summary.top3?.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star size={12} />{t.topProfit}</p>
                      <div className="space-y-2">
                        {analysis.summary.top3.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">#{i + 1} {item.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge text={`${item.units} CP`} color="bg-emerald-100 text-emerald-700" />
                              <Badge text={item.revenue} color="bg-emerald-600 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.summary.worst3?.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertTriangle size={12} />{t.worstPerf}</p>
                      <div className="space-y-2">
                        {analysis.summary.worst3.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">#{i + 1} {item.name}</span>
                            <Badge text={item.issue} color="bg-red-100 text-red-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 2. PERFORMANCA E PRODUKTEVE ── */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-slate-300 inline-block" /> {language === 'sq' ? 'Analiza e Performancës' : 'Performance Analysis'}
                </h3>

                {/* High Profit */}
                {analysis.highProfit?.length > 0 && (
                  <SectionCard icon={<TrendingUp size={16} className="text-emerald-600" />} title={t.highProfit} color="border-emerald-500">
                    <div className="space-y-2">
                      {analysis.highProfit.map((p: any, i: number) => (
                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <span className="font-black text-xs text-slate-800">{p.name}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">{p.reason}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge text={`${p.units} CP`} color="bg-slate-100 text-slate-600" />
                            {p.margin && <Badge text={p.margin} color="bg-blue-100 text-blue-700" />}
                            <Badge text={p.revenue} color="bg-emerald-100 text-emerald-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Average Profit */}
                {analysis.avgProfit?.length > 0 && (
                  <SectionCard icon={<BarChart2 size={16} className="text-blue-600" />} title={t.avgProfit} color="border-blue-400">
                    <div className="space-y-2">
                      {analysis.avgProfit.map((p: any, i: number) => (
                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <span className="font-black text-xs text-slate-800">{p.name}</span>
                            {p.note && <p className="text-[10px] text-slate-400 mt-0.5">{p.note}</p>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge text={`${p.units} CP`} color="bg-slate-100 text-slate-600" />
                            <Badge text={p.revenue} color="bg-blue-100 text-blue-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Loss Makers */}
                {analysis.lossMakers?.length > 0 && (
                  <SectionCard icon={<TrendingDown size={16} className="text-red-600" />} title={t.lossMakers} color="border-red-500">
                    <div className="space-y-2">
                      {analysis.lossMakers.map((p: any, i: number) => (
                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                          <div>
                            <span className="font-black text-xs text-slate-800">{p.name}</span>
                            <p className="text-[10px] text-red-500 mt-0.5">{p.issue}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.stockValue && <Badge text={p.stockValue} color="bg-red-100 text-red-700" />}
                            {p.suggestion && <Badge text={p.suggestion} color="bg-amber-100 text-amber-700" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* High Potential */}
                {analysis.highPotential?.length > 0 && (
                  <SectionCard icon={<Zap size={16} className="text-amber-500" />} title={t.highPotential} color="border-amber-400">
                    <div className="space-y-2">
                      {analysis.highPotential.map((p: any, i: number) => (
                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50 rounded-xl">
                          <div>
                            <span className="font-black text-xs text-slate-800">{p.name}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{p.reason}</p>
                          </div>
                          {p.action && <Badge text={p.action} color="bg-amber-100 text-amber-700" />}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* ── 3. REKOMANDIMET STRATEGJIKE ── */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-slate-300 inline-block" /> {language === 'sq' ? 'Rekomandimet Strategjike' : 'Strategic Recommendations'}
                </h3>

                {/* Scale Up */}
                {analysis.scaleUp?.length > 0 && (
                  <SectionCard icon={<ArrowUpRight size={16} className="text-emerald-600" />} title={t.scaleUp} color="border-emerald-500">
                    <div className="space-y-3">
                      {analysis.scaleUp.map((r: any, i: number) => (
                        <div key={i} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-800">{r.name}</span>
                            {r.suggestedIncrease && <Badge text={r.suggestedIncrease} color="bg-emerald-600 text-white" />}
                          </div>
                          {r.why && <p className="text-[10px] text-slate-600"><span className="font-black">{t.why}:</span> {r.why}</p>}
                          {r.how && <p className="text-[10px] text-slate-600"><span className="font-black">{t.how}:</span> {r.how}</p>}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Reduce */}
                {analysis.reduce?.length > 0 && (
                  <SectionCard icon={<ArrowDownRight size={16} className="text-red-600" />} title={t.reduce} color="border-red-500">
                    <div className="space-y-3">
                      {analysis.reduce.map((r: any, i: number) => (
                        <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-800">{r.name}</span>
                            {r.estimatedLoss && <Badge text={r.estimatedLoss} color="bg-red-100 text-red-700" />}
                          </div>
                          {r.strategy && <p className="text-[10px] text-slate-600"><span className="font-black">{t.strategy}:</span> {r.strategy}</p>}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Test */}
                {analysis.test?.length > 0 && (
                  <SectionCard icon={<Target size={16} className="text-purple-600" />} title={t.testOptimize} color="border-purple-400">
                    <div className="space-y-2">
                      {analysis.test.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <p className="text-xs font-bold text-slate-700">{r.idea}</p>
                          {r.expectedImpact && <p className="text-[10px] text-purple-600 mt-0.5"><span className="font-black">{t.expectedImpact}:</span> {r.expectedImpact}</p>}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* ── 4. SUGJERIME TË PËRGJITHSHME ── */}
              {analysis.general && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-slate-300 inline-block" /> {t.general}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysis.general.stockStrategy && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Package size={12} />{t.stockStrategy}</p>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{analysis.general.stockStrategy}</p>
                      </div>
                    )}
                    {analysis.general.marginIdeas && (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Lightbulb size={12} />{t.marginIdeas}</p>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{analysis.general.marginIdeas}</p>
                      </div>
                    )}
                    {analysis.general.mainRisk && (
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldAlert size={12} />{t.mainRisk}</p>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{analysis.general.mainRisk}</p>
                      </div>
                    )}
                    {analysis.general.kpis?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target size={12} />{t.kpis}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.general.kpis.map((kpi: string, i: number) => (
                            <Badge key={i} text={kpi} color="bg-amber-100 text-amber-700" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── HISTORY OF REPORTS ─────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-xl"><History size={18} className="text-white" /></div>
            <div>
              <h2 className="text-white font-black uppercase tracking-tight text-sm">{t.historyTitle}</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                {historyRecords.length} {language === 'sq' ? 'raporte të ruajtura' : 'saved reports'}
              </p>
            </div>
          </div>
          <button onClick={loadHistory} className="p-2 rounded-xl hover:bg-white/10 transition-colors" title="Refresh">
            <RefreshCw size={15} className={`text-slate-400 ${isLoadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-5">
          {isLoadingHistory ? (
            <div className="py-10 flex items-center justify-center gap-3 text-slate-300">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">{t.loading}</span>
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-300">
              <FileText size={36} strokeWidth={1} />
              <p className="text-sm font-bold text-center">{t.historyEmpty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.historyDate}</th>
                    <th className="text-left py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.historyPeriod}</th>
                    <th className="text-left py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.historyHealth}</th>
                    <th className="text-left py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.historyRevenue}</th>
                    <th className="text-center py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.historyProducts}</th>
                    <th className="text-center py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">PDF</th>
                    <th className="text-center py-3 px-3 font-black text-[10px] text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((rec: any) => {
                    const hs = rec.health_status ? (HEALTH_STYLES[rec.health_status] || HEALTH_STYLES['Needs Improvement']) : null;
                    return (
                      <tr key={rec.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-500">
                          {new Date(rec.created_at).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">
                          {new Date(rec.period_start).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-US', { day: '2-digit', month: 'short' })}
                          {' — '}
                          {new Date(rec.period_end).toLocaleDateString(language === 'sq' ? 'sq-AL' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3">
                          {hs ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${hs.bg} ${hs.text} border ${hs.border}`}>
                              {hs.icon} {rec.health_status}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-800">{rec.total_revenue || '—'}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-500">{rec.total_products ?? '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => executePDF(rec.analysis_data)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-slate-900 text-white font-black text-[10px] uppercase rounded-lg transition-all active:scale-95"
                          >
                            <Download size={11} /> PDF
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={async () => {
                              await supabase.from('report_history').delete().eq('id', rec.id);
                              await loadHistory();
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── SAVE MODAL ─────────────────────────────────────── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="bg-slate-900 p-3 rounded-2xl">
                <Save size={22} className="text-white" />
              </div>
              <button onClick={() => setShowSaveModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.saveModalTitle}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{t.saveModalDesc}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={isSaving}
                onClick={async () => {
                  await handleSaveReport();
                  setShowSaveModal(false);
                  executePDF();
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <><Loader2 size={14} className="animate-spin" /> {t.saving}</> : <><Save size={14} /> {t.saveAndDownload}</>}
              </button>
              <button
                onClick={() => { setShowSaveModal(false); executePDF(); }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95"
              >
                {t.onlyDownload}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
