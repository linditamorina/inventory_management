// src/services/productService.ts
import { supabase } from '../lib/supabase';
import { Product, InsertProduct, UpdateProduct } from '../types';

export const productService = {
  // GET: Merr të gjitha produktet (të filtruara sipas admin_id)
  async getProducts(): Promise<Product[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Kontrollo rolin: nëse është staff, merr admin_id nga profili
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_id')
      .eq('id', user.id)
      .single();

    const targetAdminId =
      profile?.role === 'staff' && profile?.admin_id
        ? profile.admin_id
        : user.id;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('admin_id', targetAdminId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // CREATE: Shto një produkt të ri
  async createProduct(product: InsertProduct): Promise<Product> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesioni ka skaduar. Logohu sërish.');

    // Nëse është staff, cakto admin_id nga profili i tyre
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_id')
      .eq('id', user.id)
      .single();

    const adminId =
      profile?.role === 'staff' && profile?.admin_id
        ? profile.admin_id
        : user.id;

    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, admin_id: adminId })
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