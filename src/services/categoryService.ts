import { supabase } from '../lib/supabase';
import { Category, InsertCategory } from '../types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
  },
  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
};