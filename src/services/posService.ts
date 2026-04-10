import { supabase } from '../lib/supabase';
import { SalePayload } from '../types';

export const posService = {
  async createSale(payload: SalePayload) {
    // 1. Merr ID-në e përdoruesit të loguar
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;

    // 2. Krijo Shitjen
    const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert([{
        total_amount: payload.sale.total_amount,
        payment_method: payload.sale.payment_method,
        user_id: userId
      }])
      .select()
      .single();

    if (saleError) throw new Error(saleError.message);

    // 3. Përgatit rreshtat e faturës
    const saleItems = payload.items.map(item => ({
      sale_id: newSale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) throw new Error(itemsError.message);

    // 4. Regjistro lëvizjet e stokut
    const movements = payload.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      type: 'OUT' as const,
      user_id: userId,
      reason: `Shitje - Fatura #${newSale.id.slice(0,8)}`
    }));

    const { error: stockError } = await supabase.from('stock_movements').insert(movements);
    if (stockError) console.error("Stoku dështoi:", stockError.message);

    return { sale: newSale, items: payload.items };
  }
};