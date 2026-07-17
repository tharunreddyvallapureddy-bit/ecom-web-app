import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { getCoupons } from '../services/db';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  subtotal: number;
  discountApplied: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Load cart from sessionStorage on mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem('ecom_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
  }, []);

  // Save cart to sessionStorage when updated
  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    sessionStorage.setItem('ecom_cart', JSON.stringify(newItems));
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = items.findIndex(item => item.product.id === product.id);
    let newItems = [...items];
    if (existingIndex > -1) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({ product, quantity });
    }
    saveCart(newItems);
  };

  const removeFromCart = (productId: string) => {
    const newItems = items.filter(item => item.product.id !== productId);
    saveCart(newItems);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newItems = items.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const discountApplied = (() => {
    if (!appliedCoupon || subtotal < appliedCoupon.minSubtotal) return 0;
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      return Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      return appliedCoupon.discountValue;
    }
  })();

  const totalAmount = Math.max(0, subtotal - discountApplied);

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const coupons = await getCoupons();
      const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
      
      if (!coupon) {
        return { success: false, message: 'Invalid or inactive promo code.' };
      }
      
      if (subtotal < coupon.minSubtotal) {
        return { 
          success: false, 
          message: `Minimum order amount of ₹${coupon.minSubtotal} required for this coupon.` 
        };
      }
      
      setAppliedCoupon(coupon);
      return { success: true, message: `Promo code "${coupon.code}" applied successfully!` };
    } catch (error) {
      return { success: false, message: 'Error checking coupons. Please try again.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Remove coupon if cart total falls below minimum subtotal
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minSubtotal) {
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      appliedCoupon,
      applyCouponCode,
      removeCoupon,
      subtotal,
      discountApplied,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};
