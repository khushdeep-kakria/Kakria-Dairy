'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ShoppingBag, Plus, LogOut } from 'lucide-react';

export default function AdminToolbar() {
  const {
    isAdmin,
    adminUsername,
    logoutAdmin,
    setIsOrdersDrawerOpen,
    setEditingProduct,
  } = useAuth();

  if (!isAdmin) return null;

  return (
    <aside
      aria-label="Admin controls"
      className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md text-white border-b border-dairy-gold/40 px-4 py-2.5 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-dairy-gold" />
            <span>ADMIN MODE</span>
          </span>
          <span className="text-stone-300 hidden sm:inline">
            Logged in as <strong className="text-white">@{adminUsername}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Orders Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsOrdersDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders Drawer</span>
          </button>

          {/* Add Product Modal Trigger */}
          <button
            type="button"
            onClick={() =>
              setEditingProduct({
                _isNew: true,
              })
            }
            className="px-3.5 py-1.5 rounded-xl bg-dairy-gold hover:bg-dairy-gold-light text-dairy-green-dark font-black flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logoutAdmin}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-900/80 hover:text-white text-stone-300 font-bold flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
