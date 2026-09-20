'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  FileImage,
  ExternalLink,
} from 'lucide-react';
import { formatAddress } from '@/lib/orderUtils';

interface OrderItem {
  name_en: string;
  sizeLabel_en: string;
  unitPrice: number;
  quantity: number;
  price: number;
}

interface OrderRecord {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  deliveryAddress: string;
  pincode?: string;
  orderNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
  screenshotUrl?: string;
  createdAt: string;
}

export default function AdminOrdersDrawer() {
  const { isOrdersDrawerOpen, setIsOrdersDrawerOpen, isAdmin, checkAdminSession } = useAuth();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newOrderNumbers, setNewOrderNumbers] = useState<Set<string>>(new Set());

  // Fetch Orders with silent in-place update for polling
  const fetchOrders = useCallback(async (isPolling = false) => {
    if (!isAdmin) return;
    if (!isPolling) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '50');

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: 'no-store' });
      
      if (res.status === 401) {
        setIsOrdersDrawerOpen(false);
        if (typeof checkAdminSession === 'function') checkAdminSession();
        alert('Admin session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const incomingOrders: OrderRecord[] = data.orders;
        
        // Detect new orders on polling updates
        setOrders((prevOrders) => {
          if (isPolling && prevOrders.length > 0) {
            const prevIds = new Set(prevOrders.map((o) => o.orderNumber));
            const fresh = incomingOrders.filter((o) => !prevIds.has(o.orderNumber));
            if (fresh.length > 0) {
              const toastText = fresh.length === 1
                ? `🔔 New Order #${fresh[0].orderNumber} received!`
                : `🔔 ${fresh.length} new orders received!`;
              setToast({ message: toastText, type: 'success' });
              setTimeout(() => setToast(null), 5000);

              setNewOrderNumbers((prevSet) => {
                const nextSet = new Set(prevSet);
                fresh.forEach((f) => nextSet.add(f.orderNumber));
                return nextSet;
              });
            }
          }
          return incomingOrders;
        });
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [isAdmin, statusFilter, searchQuery, checkAdminSession, setIsOrdersDrawerOpen]);

  // Initial fetch when drawer opens
  useEffect(() => {
    if (isOrdersDrawerOpen) {
      fetchOrders(false);
    }
  }, [isOrdersDrawerOpen, fetchOrders]);

  // 10s auto-refresh polling with visibility change pause/resume
  useEffect(() => {
    if (!isOrdersDrawerOpen || !isAdmin) return;

    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (!timer) {
        timer = setInterval(() => {
          fetchOrders(true);
        }, 10000);
      }
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        fetchOrders(true);
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isOrdersDrawerOpen, isAdmin, fetchOrders]);

  const handleAction = async (orderNumber: string, action: string, payload?: any) => {
    setActionLoadingId(orderNumber);
    const previousOrders = [...orders];
    let newStatus = payload?.status;
    if (action === 'verify_payment') newStatus = 'paid';
    if (action === 'reject_payment') newStatus = 'rejected';

    // Optimistic UI update
    if (newStatus) {
      setOrders((prev) =>
        prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status: newStatus } : o))
      );
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: `Order #${orderNumber} updated to ${newStatus || action}!`, type: 'success' });
        setTimeout(() => setToast(null), 3000);
        fetchOrders(true);
      } else {
        setOrders(previousOrders); // Rollback
        setToast({ message: data.error || 'Failed to update order', type: 'error' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setOrders(previousOrders); // Rollback
      setToast({ message: 'Network error updating order', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOrdersDrawerOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-dairy-border flex items-center justify-between bg-dairy-cream/40">
          <div>
            <h2 className="font-serif text-xl font-bold text-dairy-green-dark">Orders Management</h2>
            <p className="text-xs text-dairy-muted">Review payments, verify screenshots & update status</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOrdersDrawerOpen(false)}
            className="p-2 rounded-xl text-dairy-muted hover:text-dairy-text hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toast Feedback */}
        {toast && (
          <div
            className={`px-4 py-2.5 text-xs font-bold text-center transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Filters & Search */}
        <div className="p-4 border-b border-dairy-border/70 space-y-3 bg-white">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-dairy-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order#, name, phone…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-dairy-border text-xs focus:border-dairy-green focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-dairy-border text-xs font-semibold bg-white"
            >
              <option value="all">All</option>
              <option value="verification_pending">Verification Pending</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="button"
              onClick={() => fetchOrders(false)}
              className="p-2 rounded-xl bg-dairy-cream hover:bg-dairy-green hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && orders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-dairy-green border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-dairy-muted text-xs font-medium">
              No orders found matching filters.
            </div>
          ) : (
            orders.map((ord) => {
              const isV = ord.status === 'verification_pending';
              const isPaid = ord.status === 'paid';

              const isNewArrival = newOrderNumbers.has(ord.orderNumber);

              return (
                <div
                  key={ord.orderNumber}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                    isNewArrival
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-400 animate-fadeIn'
                      : isV
                      ? 'border-amber-400 bg-amber-50/20 shadow-sm ring-1 ring-amber-400/40'
                      : 'border-dairy-border bg-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-dairy-green text-sm">
                          #{ord.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ord.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'verification_pending'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : ord.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-dairy-muted mt-0.5">
                        {new Date(ord.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-base text-dairy-green">₹{ord.total}</span>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="bg-dairy-cream/40 p-2.5 rounded-xl space-y-0.5 text-[11px]">
                    <p className="font-bold text-dairy-text">{ord.customerName} · {ord.customerPhone}</p>
                    <p className="text-dairy-muted">{formatAddress(ord)}</p>
                    {ord.orderNotes && <p className="italic text-dairy-muted">Note: {ord.orderNotes}</p>}
                  </div>

                  {/* Items snapshot */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {ord.items.map((i, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-dairy-cream text-dairy-text">
                        {i.name_en} ({i.sizeLabel_en}) ×{i.quantity} = ₹{i.price}
                      </span>
                    ))}
                  </div>

                  {/* Screenshot View (If Available) */}
                  {ord.screenshotUrl ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/60 border border-blue-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ord.screenshotUrl}
                        alt="Payment Screenshot"
                        className="w-14 h-14 object-cover rounded-lg border border-blue-300 cursor-pointer hover:opacity-90 bg-white shadow-sm"
                        onClick={() => setSelectedScreenshot(ord.screenshotUrl || null)}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.retried) {
                            target.dataset.retried = 'true';
                            const parts = ord.screenshotUrl?.split('/') || [];
                            const fname = parts[parts.length - 1];
                            if (fname) {
                              target.src = `/uploads/screenshots/${fname}`;
                            }
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-blue-900 text-[11px]">Payment Screenshot Uploaded</p>
                        <button
                          type="button"
                          onClick={() => setSelectedScreenshot(ord.screenshotUrl || null)}
                          className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Full Screenshot</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-dairy-muted italic">No screenshot uploaded yet.</p>
                  )}

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-dairy-border/50">
                    {actionLoadingId === ord.orderNumber && (
                      <span className="text-[11px] text-dairy-muted flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Updating…
                      </span>
                    )}

                    {(ord.status === 'verification_pending' || ord.status === 'pending_payment' || ord.status === 'rejected') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAction(ord.orderNumber, 'verify_payment')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Payment (Paid)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            handleAction(ord.orderNumber, 'reject_payment', { reason: reason || '' });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200"
                        >
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    <select
                      value={ord.status}
                      disabled={actionLoadingId === ord.orderNumber}
                      onChange={(e) => handleAction(ord.orderNumber, 'update_status', { status: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-dairy-border text-[11px] font-bold bg-white disabled:opacity-50"
                    >
                      <option value="pending_payment">Pending</option>
                      <option value="verification_pending">Verifying</option>
                      <option value="paid">Paid</option>
                      <option value="preparing">Preparing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Screenshot Modal (Enlarged view) */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedScreenshot}
              alt="Payment Screenshot Full"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.retried) {
                  target.dataset.retried = 'true';
                  const parts = selectedScreenshot.split('/');
                  const fname = parts[parts.length - 1];
                  if (fname) {
                    target.src = `/uploads/screenshots/${fname}`;
                  }
                }
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <a
                href={selectedScreenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-black/80 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Original in New Tab</span>
              </a>
            </div>
            <button
              type="button"
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full shadow-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
