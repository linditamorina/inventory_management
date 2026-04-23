// src/hooks/usePredictor.ts
import { useQuery } from '@tanstack/react-query';
import { stockPredictorService } from '../services/stockPredictorService';
import { StockPrediction } from '../types';

export function usePredictor(daysHistory: number = 30) {
  const { data: predictions } = useQuery({
    queryKey: ['stock-predictions', daysHistory],
    queryFn: () => stockPredictorService.getPredictions(daysHistory),
  });

  // Logjika për llogaritjen e sasisë së sugjeruar
  const calculateSuggestion = (current: number, min: number = 2) => {
    // Formula: Plotësojmë limitin minimal + një rezervë sigurie (psh. 10 copë ose trefishi i limitit)
    const safetyBuffer = Math.max(10, min * 3);
    const suggested = safetyBuffer - current;
    return suggested > 0 ? suggested : 5; // Minimumi sugjeron 5 nëse llogaria del 0
  };

  const getStockStatus = (productId: string, currentStock: number, minStockLevel?: number) => {
    const min = minStockLevel ?? 2;
    const toOrder = calculateSuggestion(currentStock, min);
    
    // 1. Nëse stoku është 0 ose më pak
    if (currentStock <= 0) {
      return { 
        message: `Mbaruan! (Merr +${toOrder} CP)`, 
        color: "red",
        suggestion: toOrder 
      };
    }

    // 2. Limiti manual
    if (currentStock <= min) {
      return { 
        message: `Stok i ulët (Merr +${toOrder} CP)`, 
        color: "orange",
        suggestion: toOrder
      };
    }

    // Gjejmë parashikimin nga AI
    const prediction = predictions?.find((p: StockPrediction) => p.product_id === productId);
    
    if (!prediction) return { message: "Nuk ka të dhëna", color: "gray" };
    
    // 3. Statuset nga AI me sugjerim të integruar
    switch (prediction.status) {
      case 'CRITICAL':
        return { 
          message: `Rrezik mbarimi! (Merr +${toOrder} CP)`, 
          color: "red",
          suggestion: toOrder
        };
      case 'WARNING':
        return { 
          message: `Stok i ulët (Merr +${toOrder} CP)`, 
          color: "orange",
          suggestion: toOrder
        };
      case 'GOOD':
        return { message: "Stok i sigurt", color: "emerald" };
      default:
        return { message: "Nuk ka të dhëna", color: "gray" };
    }
  };

  return { getStockStatus, predictions };
}