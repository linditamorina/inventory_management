import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { InsertCategory } from '../types';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: categoryService.getCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCategory: InsertCategory) => categoryService.createCategory(newCategory),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}