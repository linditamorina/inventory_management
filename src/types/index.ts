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

// Tipi për Kategoritë
export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}
export type InsertCategory = Omit<Category, 'id' | 'created_at'>;

// Tipi për Lëvizjet e Stokut
export interface StockMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string | null;
  created_at: string;
}
export type InsertStockMovement = Omit<StockMovement, 'id' | 'created_at'>;