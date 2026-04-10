'use client';

import { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Receipt, Loader2 } from 'lucide-react';
import { useProducts } from '../../../hooks/useProducts';
import { posService } from '../../../services/posService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function POSPage() {
  const { data: products = [], isLoading, refetch } = useProducts();
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const generatePDF = (saleData: any) => {
    const doc = new jsPDF() as any;
    
    // Dizajni i Faturës
    doc.setFontSize(20);
    doc.text("INVOICE - POS SYSTEM", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`ID e Shitjes: ${saleData.sale.id.substring(0, 8)}`, 20, 35);

    const tableRows = saleData.items.map((item: any) => [
      item.product_name,
      item.quantity,
      `€${item.unit_price}`,
      `€${(item.quantity * item.unit_price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Produkti', 'Sasia', 'Çmimi', 'Subtotal']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] } // Ngjyra e kuqe si UI jote
    });

    doc.text(`TOTALI: €${saleData.sale.total_amount.toFixed(2)}`, 140, doc.lastAutoTable.finalY + 10);
    doc.save(`Fatura_${saleData.sale.id.substring(0, 8)}.pdf`);
  };

const handleCheckout = async () => {
  if (cart.length === 0) return;
  setIsProcessing(true);

  try {
    const payload = {
      sale: {
        total_amount: totalAmount,
        payment_method: 'CASH',
        // Kjo linjë më poshtë është e detyrueshme:
        user_id: '00000000-0000-0000-0000-000000000000' // Ose vendos ID-në tënde nga tabela 'profiles'
      },
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }))
    };

    const result = await posService.createSale(payload);
    
    // ... pjesa tjetër e kodit tënd (PDF etj)
    const pdfItems = cart.map(item => ({
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price
    }));

    generatePDF({ sale: result.sale, items: pdfItems });
    setCart([]);
    refetch();
    alert("Shitja u krye me sukses!");
  } catch (error: any) {
    alert("Gabim gjatë shitjes: " + error.message);
  } finally {
    setIsProcessing(false);
  }
};

  // ... (Pjesa tjetër e UI-së mbetet e njëjtë si në mesazhin e kaluar)
  // Sigurohu që te butoni Paguaj të kesh onClick={handleCheckout}
}