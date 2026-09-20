'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserOrder {
  id: string;
  date: string;
  items: any[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
}

interface AuthContextType {
  isAdmin: boolean;
  adminUsername: string;
  checkAdminSession: () => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  isOrdersDrawerOpen: boolean;
  setIsOrdersDrawerOpen: (open: boolean) => void;
  editingProduct: any | null;
  setEditingProduct: (product: any | null) => void;
  productsRefreshKey: number;
  triggerProductsRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [isOrdersDrawerOpen, setIsOrdersDrawerOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productsRefreshKey, setProductsRefreshKey] = useState<number>(0);

  const checkAdminSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/me', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success && data.admin) {
        setIsAdmin(true);
        setAdminUsername(data.admin.username);
        return true;
      } else {
        setIsAdmin(false);
        setAdminUsername('');
        return false;
      }
    } catch {
      setIsAdmin(false);
      setAdminUsername('');
      return false;
    }
  }, []);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  const logoutAdmin = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setIsAdmin(false);
      setAdminUsername('');
      setIsOrdersDrawerOpen(false);
      setEditingProduct(null);
    }
  };

  const triggerProductsRefresh = () => {
    setProductsRefreshKey((k) => k + 1);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminUsername,
        checkAdminSession,
        logoutAdmin,
        isOrdersDrawerOpen,
        setIsOrdersDrawerOpen,
        editingProduct,
        setEditingProduct,
        productsRefreshKey,
        triggerProductsRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
