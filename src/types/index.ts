// src/types/index.ts

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  quantity: number; 
  min_stock_level: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export type InsertProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProduct = Partial<InsertProduct>;

export interface StockMovement {
  id: string;
  product_id: string;
  user_id?: string | null;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string | null;
  created_at: string;
}

// Zgjidhja për Screenshot_14 & 15
export type InsertStockMovement = Omit<StockMovement, 'id' | 'created_at'>;

export interface StockPrediction {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  velocity: number; 
  days_remaining: number;
  status: 'CRITICAL' | 'WARNING' | 'GOOD';
  min_stock_level?: number; 
}

export interface Sale {
  id: string;
  user_id?: string | null;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export type InsertSale = Omit<Sale, 'id' | 'created_at'>;

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export type InsertSaleItem = Omit<SaleItem, 'id' | 'sale_id'>;

export interface SalePayload {
  sale: InsertSale;
  items: InsertSaleItem[];
}