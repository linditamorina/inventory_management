"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, CheckCircle, FileText, User, ShoppingBag, Euro } from 'lucide-react';

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
}

export default function NewInvoicePage() {
  const [products, setProducts] = useState<ProductItem[]>([]); 
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [clientName, setClientName] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // Ngarkimi i produkteve nga tabela kryesore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('id, name, price');
        if (error) {
          const { data: fallbackData } = await supabase.from('inventory').select('id, name, price');
          if (fallbackData) setProducts(fallbackData as ProductItem[]);
        } else {
          setProducts((data as ProductItem[]) || []);
        }
      } catch (err) {
        console.error("Ndodhi një gabim gjatë leximit të të dhënave:", err);
      }
    };
    fetchProducts();
  }, [supabase]);

  const handleAddToSession = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingItem = cart.find(item => item.product_id === prod.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === prod.id ? { ...item, quantity: item.quantity + quantity } : item
      ));
    } else {
      setCart([...cart, {
        product_id: prod.id,
        name: prod.name,
        quantity: quantity,
        price: prod.price
      }]);
    }

    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizeInvoice = async () => {
    if (cart.length === 0) return alert("Shporta është boshe!");
    setIsSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Përdoruesi nuk është i autorizuar. Ju luten kyçuni përsëri.");
        setIsSaving(false);
        return;
      }

      // 1. Ruajmë faturën kryesore
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          admin_id: user.id,
          client_name: clientName || 'Klient Anonim',
          total_amount: totalAmount
        })
        .select()
        .single();

      if (invError) {
        // Tani printon gabimin si string tekst që ta shohësh qartë në console
        console.error("Detajet e plotë të gabimit:", JSON.stringify(invError, null, 2));
        throw new Error(invError.message || "Problem me RLS apo strukturën e tabelës 'invoices'.");
      }

      if (!invoice) {
        throw new Error("Nuk u kthye asnjë e dhënë pas ruajtjes së faturës.");
      }

      // 2. Ruajmë artikujt brenda faturës (Items)
      for (const item of cart) {
        const { error: itemError } = await supabase.from('invoice_items').insert({
          invoice_id: invoice.id,
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price_per_unit: item.price,
          total_price: item.price * item.quantity
        });

        if (itemError) {
          console.error("Gabim te 'invoice_items':", JSON.stringify(itemError, null, 2));
        }

        // 3. Regjistrojmë lëvizjen në log-et e inventarit (Me try/catch të izoluar plotësisht siç e kërkoi VS Code)
        try {
          await supabase.from('inventory_logs').insert({
            admin_id: user.id,
            product_id: item.product_id,
            action_type: 'out',
            quantity_change: item.quantity,
            note: `Fatura #${invoice.invoice_number || invoice.id}`
          });
        } catch (logError) {
          console.log("Tabela 'inventory_logs' nuk u përditësua:", logError);
        }
      }

      alert("Fatura u krye dhe u ruajt me sukses!");
      setCart([]); 
      setClientName('');
    } catch (error: any) {
      console.error("Gabimi final gjatë ekzekutimit:", error);
      alert(`Gabim: ${error.message || "Ndodhi një problem gjatë komunikimit me databazën."}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-8 bg-[#f8fafc] flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-3">
          <FileText className="text-red-600" size={28} />
          Sesioni i Ri i Porosisë
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">
          Menaxhimi dhe lëshimi i faturave në kohë reale
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* PANELI I SHTIMIT */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <ShoppingBag size={16} className="text-red-600" />
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Shto Produkt në Faturë</h2>
          </div>
          
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User size={12} /> Emri i Klientit <span className="text-slate-300 font-normal lowercase">(opsionale)</span>
            </label>
            <input 
              type="text" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
              placeholder="Psh. Kompania X" 
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-600/30 focus:ring-4 focus:ring-red-600/5 p-3.5 rounded-xl text-sm font-bold text-slate-800 transition-all placeholder:text-slate-300 outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Zgjidh Produktin</label>
            <select 
              value={selectedProductId} 
              onChange={(e) => setSelectedProductId(e.target.value)} 
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-600/30 focus:ring-4 focus:ring-red-600/5 p-3.5 rounded-xl text-sm font-bold text-slate-800 transition-all outline-none cursor-pointer"
            >
              <option value="" className="text-slate-400">-- Kliko për të zgjedhur --</option>
              {products.map(p => (
                <option key={p.id} value={p.id} className="font-bold text-slate-800">
                  {p.name} — €{Number(p.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sasia për Dalje</label>
            <input 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-600/30 focus:ring-4 focus:ring-red-600/5 p-3.5 rounded-xl text-sm font-black text-slate-900 transition-all outline-none" 
            />
          </div>

          <button 
            onClick={handleAddToSession} 
            disabled={!selectedProductId} 
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 shadow-md hover:shadow-lg hover:shadow-red-600/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:shadow-none mt-2"
          >
            <Plus size={16} /> Shto në Porosi
          </button>
        </div>

        {/* PANELI I PËRMBLEDHJES */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col min-h-[420px] justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50 mb-4">
              <FileText size={16} className="text-red-600" />
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Përmbledhja e Faturës Aktuale</h2>
            </div>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">
                  Asnjë produkt në këtë sesion
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto pr-2">
                {cart.map((item, index) => (
                  <div key={index} className="py-3.5 flex justify-between items-center group animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div>
                      <p className="font-black text-sm text-slate-800 uppercase tracking-tight italic">{item.name}</p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">{item.quantity} njësi × €{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-sm text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleRemoveFromCart(index)} 
                        className="text-slate-300 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-100 pt-5 mt-6 space-y-4">
              <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-inner relative overflow-hidden">
                <div className="absolute right-4 -bottom-4 text-white/[0.03] scale-150 pointer-events-none">
                  <Euro size={120} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 italic">
                  Totali i Faturës për Pagesë:
                </span>
                <span className="text-3xl font-black tracking-tight italic">
                  €{totalAmount.toFixed(2)}
                </span>
              </div>
              
              <button 
                onClick={handleFinalizeInvoice} 
                disabled={isSaving} 
                className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> 
                {isSaving ? "Duke regjistruar transaksionin..." : "Finalizo & Ruaj Faturën"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}