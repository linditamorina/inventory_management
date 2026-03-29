'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Package, Plus, Search, Filter, Edit3, Trash2, 
  AlertTriangle, X, Loader2, CheckCircle 
} from 'lucide-react';

export default function InventoryPage() {
  // Rregullimi i gabimit nga Screenshot_6: Përdorim <any[]>
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State për formën e produktit të ri
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Pajisje',
    price: '',
    stock_quantity: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('products').insert([
      {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        user_id: user?.id 
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ name: '', sku: '', category: 'Pajisje', price: '', stock_quantity: '' });
      fetchProducts(); 
    } else {
      alert("Gabim: " + error.message);
    }
    setIsSaving(false);
  };

  // Filtimi i produkteve në bazë të kërkimit
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 italic relative min-h-screen">
      
      {/* HEADER I RI DHE I DUKSHËM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Inventory <span className="text-red-600">Stock</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            Menaxhimi i produkteve në kohë reale
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-red-600/30 active:scale-95 border-2 border-red-600"
        >
          <Plus size={20} strokeWidth={3} /> Shto Produkt të Ri
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Kërko me Emër ose SKU..." 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 font-bold transition-all shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-white border border-slate-200 py-5 rounded-[1.5rem] font-black text-slate-600 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
          <Filter size={18} /> Filtra
        </button>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Produkt / SKU</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kategoria</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Çmimi</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Stoku</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-32 text-center font-black text-slate-300 uppercase tracking-[0.3em]">Duke ngarkuar...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Package size={48} className="text-slate-200" />
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Asnjë produkt në listë</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-sm">{p.name}</span>
                        <span className="text-[10px] text-red-600 font-bold tracking-tighter">{p.sku}</span>
                      </div>
                    </td>
                    <td className="p-8 font-bold text-slate-500 uppercase text-[10px]">{p.category}</td>
                    <td className="p-8 font-black text-slate-900">${p.price}</td>
                    <td className="p-8">
                      <span className={`px-4 py-2 rounded-xl font-black text-xs ${p.stock_quantity <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-900'}`}>
                        {p.stock_quantity} CP
                      </span>
                    </td>
                    <td className="p-8 text-right space-x-2">
                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL PËR SHTIMIN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 shadow-inner">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="bg-[#1a1a1a] p-10 flex justify-between items-center text-white">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Shto Produkt</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Plotësoni të dhënat e stokut</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-3 rounded-2xl hover:bg-red-600 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emri i Produktit</label>
                  <input required type="text" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 font-bold transition-all" placeholder="Laptop Gaming..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU</label>
                  <input required type="text" value={formData.sku} onChange={(e)=>setFormData({...formData, sku: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 font-bold transition-all" placeholder="SKU-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategoria</label>
                  <select value={formData.category} onChange={(e)=>setFormData({...formData, category: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 font-bold transition-all appearance-none">
                    <option>Pajisje</option>
                    <option>Softuer</option>
                    <option>Aksesorë</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Çmimi ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={(e)=>setFormData({...formData, price: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 font-bold transition-all" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sasia</label>
                  <input required type="number" value={formData.stock_quantity} onChange={(e)=>setFormData({...formData, stock_quantity: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 font-bold transition-all" placeholder="0" />
                </div>
              </div>

              <button disabled={isSaving} type="submit" className="w-full bg-red-600 text-white font-black py-6 rounded-[1.5rem] hover:bg-slate-900 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-red-600/20 flex items-center justify-center gap-3 mt-4">
                {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20}/> Ruaj në Stok</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}