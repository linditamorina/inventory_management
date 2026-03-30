'use client';

import { useState } from 'react';
import { 
  Package, Plus, Search, Filter, Edit3, Trash2, 
  X, Loader2, CheckCircle, AlertTriangle, Trash, Sparkles, LayoutGrid, AlertCircle 
} from 'lucide-react';
import { 
  useProducts, 
  useCreateProduct, 
  useDeleteProduct, 
  useUpdateProduct 
} from '../../../hooks/useProducts';

export default function InventoryPage() {
  // 1. Hook-et e React Query
  const { data: products = [], isLoading } = useProducts();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();
  const updateMutation = useUpdateProduct();

  // 2. States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // 3. States për Filtrat e Rinj
  const [categoryFilter, setCategoryFilter] = useState('Të Gjitha');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Pajisje',
    price: '',
    stock_quantity: '',
    description: '',
    min_stock_level: '2',
  });

  // Funksioni për AI Description
  const generateAIDescription = async () => {
    if (!formData.name) return alert("Ju lutem shkruani emrin e produktit.");
    
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productName: formData.name, 
          category: formData.category 
        }),
      });
      const data = await res.json();
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
      }
    } catch (error) {
      console.error("Gabim gjatë gjenerimit me AI:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || 'Pajisje',
      price: product.price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      description: product.description || '',
      min_stock_level: product.min_stock_level?.toString() || '2',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending || updateMutation.isPending) return;

    const productData = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      description: formData.description, 
      min_stock_level: parseInt(formData.min_stock_level) || 0,
      quantity: parseInt(formData.stock_quantity) || 0, // Sinkronizim me kolonën 'quantity'
      category_id: null,
      image_url: ""
    };

    if (editingProduct) {
      updateMutation.mutate(
        { id: editingProduct.id, updates: productData as any }, 
        { onSuccess: () => { setIsModalOpen(false); setEditingProduct(null); } }
      );
    } else {
      createMutation.mutate(productData as any, { 
        onSuccess: () => { 
          setIsModalOpen(false); 
          setFormData({ name: '', sku: '', category: 'Pajisje', price: '', stock_quantity: '', description: '', min_stock_level: '2' });
        } 
      });
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setDeleteId(null);
        }
      });
    }
  };

  // LOGJIKA E FILTRIMIT TE RREPTË (Emër + Kategori + Stok)
  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'Të Gjitha' || p.category === categoryFilter;
    
    const matchesLowStock = showLowStockOnly ? (Number(p.stock_quantity) <= Number(p.min_stock_level)) : true;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Gjenerimi i Kategorive Unike për Dropdown
  const uniqueCategories = ['Të Gjitha', ...new Set(products.map((p: any) => p.category))];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 italic relative min-h-screen font-medium">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Inventory <span className="text-red-600">Stock</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Menaxhimi i produkteve në kohë reale</p>
        </div>

        <button 
          onClick={() => { setEditingProduct(null); setFormData({ name: '', sku: '', category: 'Pajisje', price: '', stock_quantity: '', description: '', min_stock_level: '2' }); setIsModalOpen(true); }}
          className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-red-600/30 active:scale-95 border-2 border-red-600"
        >
          <Plus size={20} strokeWidth={3} /> Shto Produkt
        </button>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Input i Kërkimit */}
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Kërko me Emër ose SKU..." 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 font-bold transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdown i Kategorive */}
        <div className="relative flex-shrink-0">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full lg:w-48 pl-12 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 font-black text-slate-600 uppercase text-[10px] tracking-widest transition-all shadow-sm appearance-none cursor-pointer"
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        {/* Butoni i Stokut të Ulët */}
        <button 
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`flex-shrink-0 py-5 px-8 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm border ${
            showLowStockOnly 
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertCircle size={18} /> {showLowStockOnly ? 'Trego të Gjitha' : 'Stok i Ulët'}
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
              {isLoading ? (
                <tr><td colSpan={5} className="p-32 text-center font-black text-slate-300 uppercase tracking-[0.3em]">Duke ngarkuar...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="p-32 text-center font-black text-slate-300 uppercase tracking-widest">Asnjë produkt nuk u gjet.</td></tr>
              ) : (
                filteredProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all group italic font-medium">
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-sm">{p.name}</span>
                        <span className="text-[10px] text-red-600 font-bold tracking-tighter">{p.sku}</span>
                      </div>
                    </td>
                    <td className="p-8 font-bold text-slate-500 uppercase text-[10px]">{p.category}</td>
                    <td className="p-8 font-black text-slate-900">€{p.price}</td>
                    <td className="p-8">
                      <span className={`px-4 py-2 rounded-xl font-black text-xs ${p.stock_quantity <= p.min_stock_level ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-slate-100 text-slate-900'}`}>
                        {p.stock_quantity} CP
                      </span>
                    </td>
                    <td className="p-8 text-right space-x-2">
                       <button onClick={() => openEditModal(p)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                       <button onClick={() => { setDeleteId(p.id); setDeleteConfirmOpen(true); }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SHTIM / EDITIM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#1a1a1a] p-10 flex justify-between items-center text-white border-b border-white/5">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{editingProduct ? 'Edito Produktin' : 'Shto Produkt'}</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Plotësoni të dhënat e stokut</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-3 rounded-2xl hover:bg-red-600 transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 font-bold overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emri i Produktit</label>
                  <input required type="text" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all" />
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Përshkrimi</label>
                    <button 
                      type="button"
                      onClick={generateAIDescription}
                      disabled={isGeneratingAI}
                      className="text-[10px] flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Gjenero me AI
                    </button>
                  </div>
                  <textarea 
                    rows={3}
                    value={formData.description} 
                    onChange={(e)=>setFormData({...formData, description: e.target.value})} 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all resize-none"
                    placeholder="Përshkrim i shkurtër i produktit..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</label>
                  <input required type="text" value={formData.sku} onChange={(e)=>setFormData({...formData, sku: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategoria</label>
                  <select value={formData.category} onChange={(e)=>setFormData({...formData, category: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all">
                    <option>Pajisje</option><option>Softuer</option><option>Aksesorë</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Çmimi (€)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={(e)=>setFormData({...formData, price: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sasia aktuale</label>
                  <input required type="number" value={formData.stock_quantity} onChange={(e)=>setFormData({...formData, stock_quantity: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all" />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-red-600 uppercase tracking-widest">Alarmi për Stok të Ulët (Limiti)</label>
                  <input required type="number" value={formData.min_stock_level} onChange={(e)=>setFormData({...formData, min_stock_level: e.target.value})} className="w-full p-5 bg-red-50/50 border-2 border-red-100 rounded-[1.5rem] outline-none focus:border-red-600 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-red-600 text-white font-black py-6 rounded-[2rem] hover:bg-slate-900 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-red-600/20">
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20}/> {editingProduct ? 'Përditëso' : 'Ruaj Produktin'}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-red-100">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                <AlertTriangle className="text-red-600" size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">A jeni të sigurt?</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 px-4 leading-relaxed">
                  Ky veprim është i pakthyeshëm. Produkti do të fshihet përgjithmonë nga stoku.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4 font-black">
                <button 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="w-full bg-red-600 text-white py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : <><Trash size={16}/> Po, Fshije</>}
                </button>
                <button 
                  onClick={() => { setDeleteConfirmOpen(false); setDeleteId(null); }}
                  className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Anulo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}PO