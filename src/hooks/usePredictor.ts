// src/hooks/usePredictor.ts
import { useQuery } from '@tanstack/react-query';
import { stockPredictorService } from '../services/stockPredictorService';
import { StockPrediction } from '../types';

export function usePredictor(daysHistory: number = 30) {
  const { data: predictions } = useQuery({
    queryKey: ['stock-predictions', daysHistory],
    queryFn: () => stockPredictorService.getPredictions(daysHistory),
  });

  const getStockStatus = (productId: string, currentStock: number, minStockLevel?: number) => {
    
    // 1. Nëse stoku është 0 ose më pak
    if (currentStock <= 0) {
      return { message: "Rrezik mbarimi!", color: "red" };
    }

    // 2. Limiti manual (pa tekstin "Manual")
    if (minStockLevel !== undefined && currentStock <= minStockLevel) {
      return { message: "Stok i ulët", color: "orange" };
    }

    // Gjejmë parashikimin nga AI
    const prediction = predictions?.find((p: StockPrediction) => p.product_id === productId);
    
    if (!prediction) return { message: "Nuk ka të dhëna", color: "gray" };
    
    // 3. Statuset nga AI (të pastruara nga kllapat)
    switch (prediction.status) {
      case 'CRITICAL':
        return { message: "Rrezik mbarimi!", color: "red" };
      case 'WARNING':
        return { message: "Stok i ulët", color: "orange" };
      case 'GOOD':
        return { message: "Stok i sigurt", color: "emerald" };
      default:
        return { message: "Nuk ka të dhëna", color: "gray" };
    }
  };

  return { getStockStatus, predictions };
}