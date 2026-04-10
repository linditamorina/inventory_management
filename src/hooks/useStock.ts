import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/stockService';
import { InsertStockMovement } from '../types';

export function useProductMovements(productId: string) {
  return useQuery({
    queryKey: ['stock_movements', productId],
    queryFn: () => stockService.getMovementsByProduct(productId),
    enabled: !!productId,
  });
}

// src/hooks/useStock.ts

export function useRecordMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movement: InsertStockMovement) => stockService.recordMovement(movement),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // SHTO KETE RRESHT: Rifreskon parashikimet AI sapo ndryshon stoku
      queryClient.invalidateQueries({ queryKey: ['stock-predictions'] });
    },
  });
}