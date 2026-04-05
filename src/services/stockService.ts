import { supabase } from '../lib/supabase';
import { StockMovement, InsertStockMovement } from '../types';

export const stockService = {
  async getMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const { data, error } = await supabase.from('stock_movements').select('*').eq('product_id', productId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },
  async recordMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const { data, error } = await supabase.from('stock_movements').insert(movement).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
};