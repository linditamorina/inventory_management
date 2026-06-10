'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Download, Loader2, Search, Package,
  Trash2, AlertTriangle, X, TrendingUp,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAboutCompany } from '../../../hooks/useAboutCompany';
import { useLanguage } from '../../../context/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { aboutCompany } = useAboutCompany();
  const { language } = useLanguage();
  const isSq = language === 'sq';

  const getCurrencySymbol = (cur?: string | null) => {
    const c = (cur || aboutCompany?.currency || 'EUR').toUpperCase();
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'ALL') return 'L';
    if (c === 'GBP') return '£';
    return c;
  };

  // ── Fetch orders ─────────────────────────────────────────
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('role, admin_id').eq('id', user.id).single();
      const adminId =
        profile?.role === 'staff' && profile?.admin_id ? profile.admin_id : user.id;

      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── Filter ───────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter(o =>
      o.invoice_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q)
    );
  }, [orders, searchTerm]);

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + Number(o.total_amount || 0), 0
  );

  // ── PDF Generator ────────────────────────────────────────
  const generatePDF = (order: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const sym = getCurrencySymbol(order.currency);
    const companyName = aboutCompany?.company_name || 'IMS System';
    const companyAddr = aboutCompany?.address || '';
    const companyPhone = aboutCompany?.phone || '';
    const companyEmail = aboutCompany?.email || '';
    const date = new Date(order.created_at).toLocaleDateString(
      isSq ? 'sq-AL' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    // Header
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageW, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(companyName.toUpperCase(), 14, 17);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    if (companyAddr) doc.text(companyAddr, 14, 24);
    if (companyPhone) doc.text(`Tel: ${companyPhone}`, 14, 30);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageW - 56, 7, 43, 21, 3, 3, 'F');
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(isSq ? 'FATURË' : 'INVOICE', pageW - 52, 16);
    doc.setFontSize(8);
    doc.text(`#${order.invoice_number}`, pageW - 52, 23);

    // Meta
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(isSq ? 'Data:' : 'Date:', 14, 46);
    doc.setFont('helvetica', 'bold');
    doc.text(date, 42, 46);

    let startY = 56;
    if (order.customer_name) {
      doc.setFont('helvetica', 'normal');
      doc.text(isSq ? 'Klienti:' : 'Customer:', 14, 53);
      doc.setFont('helvetica', 'bold');
      doc.text(order.customer_name, 42, 53);
      startY = 63;
    }

    autoTable(doc, {
      startY,
      head: [[
        '#',
        isSq ? 'Produkti' : 'Product',
        'SKU',
        isSq ? 'Sasia' : 'Qty',
        isSq ? 'Çmimi' : 'Unit Price',
        isSq ? 'Totali' : 'Total',
      ]],
      body: (order.order_items || []).map((item: any, i: number) => [
        i + 1,
        String(item.product_name).toUpperCase(),
        item.product_sku || '—',
        item.quantity,
        `${sym} ${Number(item.unit_price).toFixed(2)}`,
        `${sym} ${Number(item.total_price).toFixed(2)}`,
      ]),
      headStyles: {
        fillColor: [15, 23, 42], textColor: [255, 255, 255],
        fontStyle: 'bold', fontSize: 9, cellPadding: 4,
      },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { fontStyle: 'bold', cellWidth: 68 },
        2: { cellWidth: 28 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'right', cellWidth: 32 },
        5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(pageW - 88, finalY, 74, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      `${isSq ? 'TOTALI' : 'TOTAL'}: ${sym} ${Number(order.total_amount).toFixed(2)}`,
      pageW - 85, finalY + 9
    );

    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageH - 18, pageW - 14, pageH - 18);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      `${companyName} — ${isSq ? 'Faleminderit për besimin!' : 'Thank you for your business!'}`,
      14, pageH - 12
    );
    if (companyEmail) doc.text(companyEmail, pageW - 14, pageH - 12, { align: 'right' });

    doc.save(`${order.invoice_number}.pdf`);
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (orderId: string) => {
    await supabase.from('orders').delete().eq('id', orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setDeleteConfirm(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 italic">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {isSq ? 'Porosite' : 'Orders'}{' '}
            <span className="text-red-600">{isSq ? '& Faturat' : '& Invoices'}</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            {isSq ? 'Historia e shitjeve dhe faturave' : 'Sales history and invoices'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {isSq ? 'Porosi' : 'Orders'}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-4 text-center">
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1 justify-center">
              <TrendingUp size={10} /> {isSq ? 'Shitje' : 'Revenue'}
            </p>
            <p className="text-2xl font-black text-red-600 mt-1">
              {getCurrencySymbol()} {totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              isSq
                ? 'Kërko me numër fature ose emër klienti...'
                : 'Search by invoice number or customer name...'
            }
            className="w-full pl-14 pr-12 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:border-red-300 font-bold text-slate-800 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
            >
              <X size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  # {isSq ? 'Fatura' : 'Invoice'}
                </th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {isSq ? 'Data' : 'Date'}
                </th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {isSq ? 'Klienti' : 'Customer'}
                </th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {isSq ? 'Artikuj' : 'Items'}
                </th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {isSq ? 'Totali' : 'Total'}
                </th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                  {isSq ? 'Veprime' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-red-600 mb-4" size={32} />
                    <span className="font-black text-slate-300 uppercase tracking-[0.3em] text-xs">
                      {isSq ? 'Duke ngarkuar...' : 'Loading...'}
                    </span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Receipt size={24} className="text-slate-300" />
                    </div>
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
                      {isSq ? 'Asnjë porosi e gjetur' : 'No orders found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => {
                  const sym = getCurrencySymbol(order.currency);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group italic font-medium">
                      <td className="p-6 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Receipt size={15} className="text-red-600" />
                          </div>
                          <span className="font-black text-slate-900 text-sm tracking-tight">
                            {order.invoice_number}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 px-8">
                        <span className="text-xs font-bold text-slate-600">
                          {new Date(order.created_at).toLocaleDateString(
                            isSq ? 'sq-AL' : 'en-GB'
                          )}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="p-6 px-8">
                        {order.customer_name ? (
                          <span className="text-xs font-black text-slate-700">
                            {order.customer_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic font-medium">
                            {isSq ? '— pa klient' : '— no customer'}
                          </span>
                        )}
                      </td>
                      <td className="p-6 px-8">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500">
                          <Package size={11} /> {order.order_items?.length || 0}
                        </span>
                      </td>
                      <td className="p-6 px-8">
                        <span className="font-black text-slate-900 text-base">
                          {sym} {Number(order.total_amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => generatePDF(order)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
                          >
                            <Download size={13} strokeWidth={2.5} /> PDF
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(order.id)}
                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-xl transition-all shadow-sm"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <AlertTriangle className="text-red-600 mx-auto" size={40} strokeWidth={2} />
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter italic">
                {isSq ? 'Fshij Porosinë?' : 'Delete Order?'}
              </h3>
              <p className="text-slate-500 text-sm font-medium mt-2">
                {isSq
                  ? 'Stoku i produkteve NUK do të rikthehet.'
                  : 'Product stock will NOT be restored.'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all"
              >
                {isSq ? 'Po, Fshije' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
              >
                {isSq ? 'Anulo' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
