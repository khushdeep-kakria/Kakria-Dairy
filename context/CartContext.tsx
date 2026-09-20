'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '@/types/product';

interface DiscountBreakdown {
  gheeDiscount: number;
  orderDiscount: number;
  totalDiscount: number;
  gheeWeightKg: number;
  hasGheeDiscount: boolean;
  hasOrderDiscount: boolean;
  explanation_en: string;
  explanation_pa: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: 'full' | 'half', qty?: number) => void;
  updateQuantity: (productId: string, size: 'full' | 'half', qty: number) => void;
  removeFromCart: (productId: string, size: 'full' | 'half') => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  isFreeDelivery: boolean;
  amountNeededForFreeDelivery: number;
  discounts: DiscountBreakdown;
  grandTotal: number;
  lastAddedTime: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [lastAddedTime, setLastAddedTime] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kakria_dairy_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read cart from localStorage', e);
    }
    setMounted(true);
  }, []);

  // Re-sync cart items with live database prices and photos
  useEffect(() => {
    if (!mounted) return;
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          const prodMap = new Map(data.products.map((p: any) => [p.id, p]));
          setItems((prev) => {
            let changed = false;
            const updated = prev.map((item) => {
              const live = prodMap.get(item.productId) as Product | undefined;
              if (!live) return item;
              const isHalf = item.size === 'half' && live.has_half;
              const freshPrice = isHalf && live.price_half ? live.price_half : live.price_primary;
              if (
                item.unitPrice !== freshPrice ||
                item.name_en !== live.name_en ||
                item.image !== live.image
              ) {
                changed = true;
                return {
                  ...item,
                  unitPrice: freshPrice,
                  name_en: live.name_en,
                  name_pa: live.name_pa,
                  image: live.image,
                };
              }
              return item;
            });
            return changed ? updated : prev;
          });
        }
      })
      .catch(() => {});
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('kakria_dairy_cart', JSON.stringify(items));
      } catch (e) {
        console.warn('Could not save cart to localStorage', e);
      }
    }
  }, [items, mounted]);

  const addToCart = (product: Product, size: 'full' | 'half', qty = 1) => {
    setItems(prev => {
      const isHalf = size === 'half' && product.has_half;
      const unitPrice = isHalf && product.price_half ? product.price_half : product.price_primary;
      const sizeLabel_en = isHalf ? (product.half_unit_label_en || '500g') : product.primary_unit_label_en;
      const sizeLabel_pa = isHalf ? (product.half_unit_label_pa || '500 ਗ੍ਰਾਮ') : product.primary_unit_label_pa;
      
      // Calculate weight in kg for Ghee promotion
      let weightInKg = 0;
      if (product.category === 'ghee') {
        weightInKg = isHalf ? 0.5 : 1.0;
      }

      const existingIndex = prev.findIndex(item => item.productId === product.id && item.size === size);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name_en: product.name_en,
            name_pa: product.name_pa,
            category: product.category,
            size,
            sizeLabel_en,
            sizeLabel_pa,
            weightInKg,
            unitPrice,
            quantity: qty,
            image: product.image,
          },
        ];
      }
    });
    setLastAddedTime(Date.now());
  };

  const updateQuantity = (productId: string, size: 'full' | 'half', qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: qty }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, size: 'full' | 'half') => {
    setItems(prev => prev.filter(item => !(item.productId === productId && item.size === size)));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculations
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  // Delivery: If subtotal >= 300 FREE, else 50
  const isFreeDelivery = subtotal >= 300 || subtotal === 0;
  const deliveryFee = subtotal === 0 ? 0 : isFreeDelivery ? 0 : 50;
  const amountNeededForFreeDelivery = subtotal === 0 ? 300 : Math.max(0, 300 - subtotal);

  // Offers Logic:
  // 1. Ghee weight in cart >= 5kg -> 5% off on Ghee items
  const gheeItems = items.filter(item => item.category === 'ghee');
  const gheeWeightKg = gheeItems.reduce((acc, item) => acc + item.weightInKg * item.quantity, 0);
  const gheeSubtotal = gheeItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  
  const hasGheeDiscount = gheeWeightKg >= 5;
  const gheeDiscount = hasGheeDiscount ? Math.round(gheeSubtotal * 0.05) : 0;

  // 2. Subtotal >= 1000 -> 5% off order
  // If ghee discount already applies, we apply 5% on remaining non-ghee items or on entire order without double-discounting
  const hasOrderDiscount = subtotal >= 1000;
  let orderDiscount = 0;
  let explanation_en = '';
  let explanation_pa = '';

  if (hasGheeDiscount && hasOrderDiscount) {
    // Both qualify: 5% off Ghee items + 5% off remaining non-ghee items (effectively 5% off entire order)
    // We clearly display both components so the customer sees both offers honored!
    const nonGheeSubtotal = subtotal - gheeSubtotal;
    orderDiscount = Math.round(nonGheeSubtotal * 0.05);
    explanation_en = 'Both offers applied: 5% Bulk Ghee discount (5kg+) + 5% Order discount on other items.';
    explanation_pa = 'ਦੋਵੇਂ ਆਫ਼ਰਜ਼ ਲਾਗੂ: 5 ਕਿੱਲੋ ਘਿਓ \'ਤੇ 5% ਛੋਟ + ਬਾਕੀ ਆਰਡਰ \'ਤੇ 5% ਛੋਟ।';
  } else if (hasGheeDiscount) {
    explanation_en = `5% Bulk Ghee discount applied for reaching ${gheeWeightKg}kg Ghee!`;
    explanation_pa = `${gheeWeightKg} ਕਿੱਲੋ ਦੇਸੀ ਘਿਓ ਲੈਣ 'ਤੇ 5% ਦੀ ਵਿਸ਼ੇਸ਼ ਛੋਟ ਲਾਗੂ!`;
  } else if (hasOrderDiscount) {
    orderDiscount = Math.round(subtotal * 0.05);
    explanation_en = '5% Storewide discount applied for orders above ₹1000!';
    explanation_pa = '₹1000 ਤੋਂ ਵੱਧ ਦੇ ਆਰਡਰ \'ਤੇ 5% ਦੀ ਵਿਸ਼ੇਸ਼ ਛੋਟ ਲਾਗੂ!';
  }

  const totalDiscount = gheeDiscount + orderDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount + deliveryFee);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        isFreeDelivery,
        amountNeededForFreeDelivery,
        discounts: {
          gheeDiscount,
          orderDiscount,
          totalDiscount,
          gheeWeightKg,
          hasGheeDiscount,
          hasOrderDiscount,
          explanation_en,
          explanation_pa,
        },
        grandTotal,
        lastAddedTime,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
