// src/services/productService.ts
import { supabase } from '../lib/supabase';
import { Product, InsertProduct, UpdateProduct } from '../types';

export const productService = {
  // GET: Merr të gjitha produktet
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // CREATE: Shto një produkt të ri
  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // UPDATE: Përditëso një produkt ekzistues
  async updateProduct(id: string, updates: UpdateProduct): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // DELETE: Fshi një produkt
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};