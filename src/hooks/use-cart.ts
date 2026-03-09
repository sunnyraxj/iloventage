'use client';

import { useContext } from 'react';
import { CartContext } from '@/providers/cart-provider';
import type { CartItem, Product } from '@/lib/types';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const { state, dispatch } = context;

  const addItem = (item: { product: Product; quantity: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => total + item.product.price * item.quantity, 0);


  return {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };
};
