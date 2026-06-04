"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Calendar, User, Package } from 'lucide-react';

interface InvoiceItem {
  id: string;
  product_name: string;
  quantity: number;
}

interface Invoice {
  id: string;
  invoice_number: number;
  client_name: string;
  total_amount: number;
  created_at: string;
  invoice_items: InvoiceItem[];
}

export default function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        const { data, error } = await supabase
          .from('invoices')
          .select('*, invoice_items(id, product_name, quantity)')
          .eq('admin_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setInvoices(data as Invoice[]);
        } else {
          console.error("Gabim gjatë leximit të historikut:", error?.message);
        }
      } catch (err) {
        console.error("Gabim në server:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8 bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center font-black uppercase italic tracking-widest text-slate-400 animate-pulse">
          Duke ngarkuar historikun...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-8 bg-[#f8fafc] flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-slate-900">
          Historiku i Faturave
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">
          Lista kronologjike e të gjitha shitjeve dhe porosive të regjistruara
        </p>
      </div>
      
      {/* TABELA E HISTORIKUT */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="p-5 w-28">Nr. Faturës</th>
                <th className="p-5">Klienti</th>
                <th className="p-5">Artikujt e shitur</th>
                <th className="p-5 w-44">Data e lëshimit</th>
                <th className="p-5 w-36 text-right">Vlera Totale</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-100 bg-white">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-300 italic font-bold">
                    Nuk ka asnjë faturë të regjistruar në sistem.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    
                    {/* ID OSE NUMRI I FATURËS */}
                    <td className="p-5 text-slate-900 font-black">
                      #{inv.invoice_number || inv.id.substring(0, 5)}
                    </td>
                    
                    {/* EMRI I KLIENTIT */}
                    <td className="p-5">
                      <span className="inline-flex items-center gap-2 text-slate-800 font-black uppercase tracking-tight italic">
                        <User size={14} className="text-slate-400 shrink-0" /> 
                        {inv.client_name}
                      </span>
                    </td>
                    
                    {/* ARTIKUJT E SHITUR */}
                    <td className="p-5">
                      <span className="flex flex-wrap gap-1.5 max-w-xl">
                        {inv.invoice_items && inv.invoice_items.length > 0 ? (
                          inv.invoice_items.map((item) => (
                            <span 
                              key={item.id} 
                              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase text-slate-600 italic tracking-tight"
                            >
                              <Package size={11} className="text-slate-400" />
                              {item.product_name}
                              <span className="bg-slate-200 text-slate-700 font-black px-1.5 py-0.5 rounded-md ml-1 text-[10px]">
                                x{item.quantity}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-300 font-normal italic">
                            Pa artikuj të specifikuar
                          </span>
                        )}
                      </span>
                    </td>
                    
                    {/* DATA E LËSHIMIT */}
                    <td className="p-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        <Calendar size={13} className="text-slate-400" /> 
                        {new Date(inv.created_at).toLocaleDateString('sq-AL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    
                    {/* VLERA TOTALE */}
                    <td className="p-5 text-right">
                      <span className="inline-flex items-center font-black text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-sm italic tracking-tight">
                        €{Number(inv.total_amount).toFixed(2)}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}