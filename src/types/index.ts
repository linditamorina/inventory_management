// src/types/index.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  quantity: number;
  min_stock_level: number;
  category_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Tipi për kur krijojmë/updatojmë (pa id dhe data që i shton databaza vetë)
export type InsertProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProduct = Partial<InsertProduct>;