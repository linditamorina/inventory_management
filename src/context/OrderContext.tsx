'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

export type CartItem = {
  product_id: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  available_stock: number;
};

type OrderContextType = {
  cartItems: CartItem[];
  isOpen: boolean;
  customerName: string;
  notes: string;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  cartTotal: number;
  cartCount: number;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const addToCart = useCallback((product: any) => {
    if (Number(product.quantity) <= 0) return;
    setCartItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= existing.available_stock) return prev;
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.available_stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku || '',
          unit_price: Number(product.price) || 0,
          quantity: 1,
          available_stock: Number(product.quantity) || 0,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(i => i.product_id !== productId));
      return;
    }
    setCartItems(prev =>
      prev.map(i =>
        i.product_id === productId
          ? { ...i, quantity: Math.min(qty, i.available_stock) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCustomerName('');
    setNotes('');
  }, []);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <OrderContext.Provider
      value={{
        cartItems, isOpen, customerName, notes,
        setCustomerName, setNotes,
        addToCart, removeFromCart, updateQty, clearCart,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        cartTotal, cartCount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
};
