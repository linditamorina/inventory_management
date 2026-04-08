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


// import { supabase } from '../lib/supabase';
// import { StockMovement, InsertStockMovement } from '../types';

// export const stockService = {
//   async getMovementsByProduct(productId: string): Promise<StockMovement[]> {
//     // Shtojmë lidhjen me tabelën profiles përmes user_id
//     const { data, error } = await supabase
//       .from('stock_movements')
//       .select(`
//         *,
//         profiles:user_id (
//           full_name
//         )
//       `)
//       .eq('product_id', productId)
//       .order('created_at', { ascending: false });

//     if (error) throw new Error(error.message);
    
//     // Mapojmë të dhënat që TypeScript të mos ankohet për strukturën e re
//     return data || [];
//   },

//   async recordMovement(movement: InsertStockMovement): Promise<StockMovement> {
//     const { data, error } = await supabase
//       .from('stock_movements')
//       .insert(movement)
//       .select()
//       .single();
    
//     if (error) throw new Error(error.message);
//     return data;
//   }
// };