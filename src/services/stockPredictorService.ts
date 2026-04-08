// src/services/stockPredictorService.ts
import { supabase } from '../lib/supabase';
import { StockPrediction } from '../types';

export const stockPredictorService = {
  /**
   * Merr parashikimet e stokut bazuar në historikun e shitjeve
   * @param daysHistory Sa ditë mbrapa duam të analizojmë (default 30)
   */
  async getPredictions(daysHistory: number = 30): Promise<StockPrediction[]> {
    const { data, error } = await supabase
      .rpc('get_stock_predictions', { days_history: daysHistory });

    if (error) throw new Error(`Gabim në gjenerimin e parashikimeve: ${error.message}`);
    
    return data || [];
  }
};