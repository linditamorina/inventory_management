'use client';
import { Package, DollarSign, List, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function AddProductPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Shto Produkt</h1>
        <Link href="/" className="bg-white p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 shadow-sm transition-all"><X size={24}/></Link>
      </div>

      <form className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8 italic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Emri i Produktit</label>
            <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all font-bold" placeholder="p.sh. Samsung Galaxy S24" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Çmimi (€)</label>
            <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all font-bold" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sasia në Stok</label>
            <input type="number" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all font-bold" placeholder="0" />
          </div>
        </div>
        <button className="w-full bg-red-600 text-white font-black py-6 rounded-2xl hover:bg-slate-900 shadow-xl shadow-red-600/20 transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3">
          <Save size={20} /> Ruaj Produktin
        </button>
      </form>
    </div>
  );
}