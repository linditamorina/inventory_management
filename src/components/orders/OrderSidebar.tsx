'use client';

import React, { useState } from 'react';
import {
  X, ShoppingCart, Plus, Minus, Trash2, User, FileText,
  Loader2, CheckCircle, Receipt, Download, AlertCircle,
} from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAboutCompany } from '../../hooks/useAboutCompany';
import { useLanguage } from '../../context/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type CompletedInvoice = {
  invoiceNum: string;
  total: number;
  items: any[];
  customerName: string;
  createdAt: string;
};

export default function OrderSidebar() {
  const {
    cartItems, isOpen, closeCart,
    customerName, setCustomerName,
    notes, setNotes,
    removeFromCart, updateQty, clearCart,
    cartTotal, cartCount,
  } = useOrder();

  const { aboutCompany } = useAboutCompany();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState<CompletedInvoice | null>(null);

  const isSq = language === 'sq';

  const getCurrencySymbol = () => {
    const c = (aboutCompany?.currency || 'EUR').toUpperCase();
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'ALL') return 'L';
    if (c === 'GBP') return '£';
    return c;
  };
  const currencySymbol = getCurrencySymbol();

  // ── PDF Generator ─────────────────────────────────────────
  const generatePDF = (inv: CompletedInvoice) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const sym = currencySymbol;
    const companyName = aboutCompany?.company_name || 'IMS System';
    const companyAddr = aboutCompany?.address || '';
    const companyPhone = aboutCompany?.phone || '';
    const companyEmail = aboutCompany?.email || '';
    const date = new Date(inv.createdAt).toLocaleDateString(
      isSq ? 'sq-AL' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    // Red header band
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

    // Invoice badge (top-right)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageW - 56, 7, 43, 21, 3, 3, 'F');
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(isSq ? 'FATURË' : 'INVOICE', pageW - 52, 16);
    doc.setFontSize(8);
    doc.text(`#${inv.invoiceNum}`, pageW - 52, 23);

    // Meta info
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(isSq ? 'Data:' : 'Date:', 14, 46);
    doc.setFont('helvetica', 'bold');
    doc.text(date, 42, 46);

    let startY = 56;
    if (inv.customerName) {
      doc.setFont('helvetica', 'normal');
      doc.text(isSq ? 'Klienti:' : 'Customer:', 14, 53);
      doc.setFont('helvetica', 'bold');
      doc.text(inv.customerName, 42, 53);
      startY = 63;
    }

    // Items table
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
      body: inv.items.map((item: any, i: number) => [
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

    // Total box
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(pageW - 88, finalY, 74, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      `${isSq ? 'TOTALI' : 'TOTAL'}: ${sym} ${inv.total.toFixed(2)}`,
      pageW - 85, finalY + 9
    );

    // Footer
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

    doc.save(`${inv.invoiceNum}.pdf`);
  };

  // ── Complete Order ─────────────────────────────────────────
  const handleCompleteOrder = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(isSq ? 'Sesioni ka skaduar. Logohu sërish.' : 'Session expired. Please log in again.');

      const { data: profile } = await supabase
        .from('profiles').select('role, admin_id').eq('id', user.id).single();
      const adminId =
        profile?.role === 'staff' && profile?.admin_id ? profile.admin_id : user.id;

      // Final stock validation
      for (const item of cartItems) {
        const { data: prod } = await supabase
          .from('products').select('quantity, name').eq('id', item.product_id).single();
        if (!prod || Number(prod.quantity) < item.quantity) {
          throw new Error(
            isSq
              ? `Stok i pamjaftueshëm për "${item.product_name}"! (${prod?.quantity ?? 0} mbetur)`
              : `Insufficient stock for "${item.product_name}"! (${prod?.quantity ?? 0} left)`
          );
        }
      }

      // Invoice number
      const { count } = await supabase
        .from('orders').select('*', { count: 'exact', head: true }).eq('admin_id', adminId);
      const invoiceNum = `FAT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      // Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          admin_id: adminId,
          invoice_number: invoiceNum,
          customer_name: customerName.trim() || null,
          notes: notes.trim() || null,
          total_amount: cartTotal,
          currency: currencySymbol,
          status: 'completed',
        })
        .select()
        .single();
      if (orderErr) throw orderErr;

      // Insert order items
      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: parseFloat((item.unit_price * item.quantity).toFixed(2)),
      }));
      await supabase.from('order_items').insert(orderItemsData);

      // Deduct stock for each item
      for (const item of cartItems) {
        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          type: 'OUT',
          quantity: item.quantity,
          reason: `${isSq ? 'Shitje' : 'Sale'} — ${invoiceNum}`,
        });
        const { data: prod } = await supabase
          .from('products').select('quantity').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products')
            .update({ quantity: Math.max(0, Number(prod.quantity) - item.quantity) })
            .eq('id', item.product_id);
        }
      }

      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      setCompletedInvoice({
        invoiceNum,
        total: cartTotal,
        items: orderItemsData,
        customerName: customerName.trim(),
        createdAt: order.created_at,
      });
      clearCart();

    } catch (err: any) {
      setError(err.message || (isSq ? 'Ndodhi një gabim.' : 'An error occurred.'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150]"
        onClick={() => { if (!completedInvoice) closeCart(); }}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[400px] max-w-[95vw] bg-white shadow-2xl z-[151] flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl">
              <ShoppingCart size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-tighter text-sm italic">
                {isSq ? 'Porosi e Re' : 'New Order'}
              </h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {cartCount} {isSq ? 'artikuj' : 'items'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cartItems.length > 0 && !completedInvoice && (
              <button
                onClick={clearCart}
                className="text-[9px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
              >
                {isSq ? 'Pastro' : 'Clear'}
              </button>
            )}
            <button onClick={closeCart} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ── SUCCESS STATE ─────────────────────────────── */}
        {completedInvoice ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={40} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 italic">
                {isSq ? 'Porosi e Kryer!' : 'Order Complete!'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                #{completedInvoice.invoiceNum}
              </p>
            </div>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isSq ? 'Total' : 'Total'}
                </span>
                <span className="text-base font-black text-slate-900">
                  {currencySymbol} {completedInvoice.total.toFixed(2)}
                </span>
              </div>
              {completedInvoice.customerName && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isSq ? 'Klienti' : 'Customer'}
                  </span>
                  <span className="text-xs font-black text-slate-700">{completedInvoice.customerName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isSq ? 'Artikuj' : 'Items'}
                </span>
                <span className="text-xs font-black text-slate-700">{completedInvoice.items.length}</span>
              </div>
            </div>
            <button
              onClick={() => generatePDF(completedInvoice)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 hover:bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
            >
              <Download size={15} strokeWidth={2.5} />
              {isSq ? 'Shkarko Faturën PDF' : 'Download Invoice PDF'}
            </button>
            <button
              onClick={() => { setCompletedInvoice(null); closeCart(); }}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
            >
              {isSq ? 'Mbyll' : 'Close'}
            </button>
          </div>

        ) : (
          <>
            {/* ── CART ITEMS ─────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                    <ShoppingCart size={24} className="text-slate-200" />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                    {isSq ? 'Shto produkte nga lista' : 'Add products from the list'}
                  </p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.product_id} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-[11px] uppercase truncate italic">
                        {item.product_name}
                      </p>
                      {item.product_sku && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {item.product_sku}
                        </p>
                      )}
                      <p className="text-[11px] font-black text-red-600 mt-1.5">
                        {currencySymbol} {(item.unit_price * item.quantity).toFixed(2)}
                        <span className="text-slate-400 font-medium ml-1 text-[9px]">
                          ({currencySymbol} {item.unit_price.toFixed(2)} × {item.quantity})
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-1">
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} strokeWidth={2.5} />
                      </button>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQty(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-500 hover:text-red-600 transition-colors"
                        >
                          <Minus size={10} strokeWidth={3} />
                        </button>
                        <span className="text-xs font-black text-slate-900 w-7 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_stock}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={10} strokeWidth={3} />
                        </button>
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">
                        max {item.available_stock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── BOTTOM SECTION ─────────────────────────── */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-4 space-y-3 bg-white flex-shrink-0">
                {/* Customer name */}
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={isSq ? 'Emri i klientit (opsional)' : 'Customer name (optional)'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-300 focus:bg-white transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="relative">
                  <FileText size={13} className="absolute left-4 top-3.5 text-slate-400" />
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={isSq ? 'Shënime (opsional)' : 'Notes (optional)'}
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-300 focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-red-600 leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Total + Action */}
                <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                      {isSq ? 'Totali' : 'Total'}
                    </span>
                    <span className="text-2xl font-black text-white italic">
                      {currencySymbol} {cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCompleteOrder}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black uppercase text-[11px] tracking-widest rounded-xl transition-all active:scale-95 italic"
                  >
                    {isProcessing ? (
                      <><Loader2 size={14} className="animate-spin" /> {isSq ? 'Duke procesuar...' : 'Processing...'}</>
                    ) : (
                      <><Receipt size={15} strokeWidth={2.5} /> {isSq ? 'Perfundo Porosinë' : 'Complete Order'}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
