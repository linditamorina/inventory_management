// src/hooks/usePredictor.ts
import { useQuery } from '@tanstack/react-query';
import { stockPredictorService } from '../services/stockPredictorService';

export function useStockPredictions(daysHistory: number = 30) {
  return useQuery({
    queryKey: ['stock-predictions', daysHistory],
    queryFn: () => stockPredictorService.getPredictions(daysHistory),
  });
}