'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Lock,
  LogOut,
  ShoppingBag,
  Package,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Plus,
  Edit2,
  Trash2,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface OrderItem {
  productId: string;
  name_en: string;
  name_pa?: string;
  size: string;
  sizeLabel_en: string;
  unitPrice: number;
  quantity: number;
  price: number;
  image: string;
}

interface OrderRecord {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  deliveryAddress: string;
  orderNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
  utr?: string;
  paymentMethod: string;
  verifiedAt?: string;
  createdAt: string;
}

interface ProductRecord {
  id: string;
  name_en: string;
  name_pa?: string;
  description_en: string;
  description_pa?: string;
  category: string;
  price_primary: number;
  price_half?: number;
  primary_unit_label_en: string;
  primary_unit_label_pa?: string;
  half_unit_label_en?: string;
  half_unit_label_pa?: string;
  has_half?: boolean;
  image: string;
  is_bestseller?: boolean;
  inStock: boolean;
  discontinued: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('');

  // Login form state
  const [loginUser, setLoginUser] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newOrderNumbers, setNewOrderNumbers] = useState<Set<string>>(new Set());

  // Products state
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [isNewProduct, setIsNewProduct] = useState<boolean>(false);
  const [productFormError, setProductFormError] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.admin) {
        setIsAuthenticated(true);
        setAdminUsername(data.admin.username);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch Orders with silent in-place update for polling
  const fetchOrders = useCallback(async (isPolling = false) => {
    if (!isPolling) setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: 'no-store' });
      
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoginError('Session expired. Please log in again.');
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const incomingOrders: OrderRecord[] = data.orders;

        setOrders((prevOrders) => {
          if (isPolling && prevOrders.length > 0) {
            const prevIds = new Set(prevOrders.map((o) => o.orderNumber));
            const fresh = incomingOrders.filter((o) => !prevIds.has(o.orderNumber));
            if (fresh.length > 0) {
              const msg = fresh.length === 1
                ? `🔔 New Order #${fresh[0].orderNumber} received from ${fresh[0].customerName}!`
                : `🔔 ${fresh.length} new orders received!`;
              setToast({ message: msg, type: 'success' });
              setTimeout(() => setToast(null), 5000);

              setNewOrderNumbers((prev) => {
                const next = new Set(prev);
                fresh.forEach((f) => next.add(f.orderNumber));
                return next;
              });
            }
          }
          return incomingOrders;
        });
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      if (!isPolling) setOrdersLoading(false);
    }
  }, [statusFilter, searchQuery, dateFrom, dateTo]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Initial load when tab is active
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'orders') fetchOrders(false);
      if (activeTab === 'products') fetchProducts();
    }
  }, [isAuthenticated, activeTab, fetchOrders, fetchProducts]);

  // 10s auto-refresh polling while orders panel is open, pausing on hidden tab
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'orders') return;

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
  }, [isAuthenticated, activeTab, fetchOrders]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminUsername(data.admin?.username || loginUser);
      } else {
        setLoginError(data.error || 'Login failed. Please check credentials.');
      }
    } catch {
      setLoginError('Network error during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
    }
  };

  // Order Actions (Verify, Reject, Status Update)
  const handleOrderAction = async (
    orderNumber: string,
    action: string,
    payload?: { status?: string; reason?: string }
  ) => {
    setActionLoadingId(orderNumber);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch {
      alert('Network error while updating order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle In Stock
  const handleToggleStock = async (product: ProductRecord) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, inStock: !p.inStock } : p))
        );
      }
    } catch (err) {
      alert('Failed to update stock status');
    }
  };

  // Toggle Discontinued
  const handleToggleDiscontinued = async (product: ProductRecord) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discontinued: !product.discontinued }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, discontinued: !p.discontinued } : p))
        );
      }
    } catch (err) {
      alert('Failed to update product state');
    }
  };

  // Upload Product Photo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploadingImage(true);
    setProductFormError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setEditingProduct({ ...editingProduct, image: data.url });
      } else {
        setProductFormError(data.error || 'Upload failed. You can paste a direct image URL instead.');
      }
    } catch {
      setProductFormError('Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setProductFormError('');

    if (
      !editingProduct.name_en ||
      !editingProduct.description_en ||
      !editingProduct.category ||
      editingProduct.price_primary === undefined ||
      !editingProduct.image
    ) {
      setProductFormError('Name, Description, Category, Price, and Image are required.');
      return;
    }

    try {
      const url = isNewProduct ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isNewProduct ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json();
      if (data.success) {
        setEditingProduct(null);
        setIsNewProduct(false);
        fetchProducts();
      } else {
        setProductFormError(data.error || 'Failed to save product.');
      }
    } catch {
      setProductFormError('Network error while saving product.');
    }
  };

  // Loading Session check
  if (isAuthenticated === null) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-dairy-green border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // ── 1. LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="py-16 px-4 sm:px-6 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-dairy-green text-white flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-black text-dairy-green-dark">Admin Login</h1>
          <p className="text-xs text-dairy-muted">
            Kakria Dairy Management Panel · Protected Access
          </p>
        </div>

        {loginError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border shadow-dairy space-y-4">
          <div>
            <label className="block text-xs font-bold text-dairy-text mb-1.5">Username</label>
            <input
              type="text"
              required
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              placeholder="e.g. admin"
              className="w-full px-4 py-3 rounded-xl border border-dairy-border focus:border-dairy-green focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dairy-text mb-1.5">Password</label>
            <input
              type="password"
              required
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-dairy-border focus:border-dairy-green focus:outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            {loginLoading ? 'Signing In…' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  // ── 2. DASHBOARD SCREEN ──────────────────────────────────────────────────────
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-dairy-border shadow-dairy">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image src="/images/logo.svg" alt="Kakria Dairy" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-black text-dairy-green-dark">
              Kakria Dairy · Admin Dashboard
            </h1>
            <p className="text-xs text-dairy-muted">
              Logged in as <span className="font-bold text-dairy-green">@{adminUsername}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-dairy-border hover:bg-rose-50 hover:text-rose-700 text-dairy-text text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-dairy-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-dairy-green text-white shadow-md'
              : 'bg-white text-dairy-text hover:bg-dairy-cream'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders Management</span>
          {orders.filter((o) => o.status === 'verification_pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {orders.filter((o) => o.status === 'verification_pending').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'products'
              ? 'bg-dairy-green text-white shadow-md'
              : 'bg-white text-dairy-text hover:bg-dairy-cream'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog</span>
          <span className="text-[10px] text-dairy-muted">({products.length})</span>
        </button>
      </div>

      {/* ── ORDERS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Toast Notification Banner */}
          {toast && (
            <div
              className={`p-4 rounded-2xl text-center text-sm font-black shadow-md animate-fadeIn transition-all ${
                toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-3xl p-5 border border-dairy-border shadow-dairy space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-dairy-muted absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order#, phone, name, UTR…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dairy-border text-xs focus:border-dairy-green focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dairy-border text-xs focus:border-dairy-green focus:outline-none bg-white font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="verification_pending">Verification Pending (UTR)</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="paid">Paid (Verified)</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-1/2 px-2.5 py-2.5 rounded-xl border border-dairy-border text-xs"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-1/2 px-2.5 py-2.5 rounded-xl border border-dairy-border text-xs"
                />
                <button
                  type="button"
                  onClick={() => fetchOrders(false)}
                  className="p-2.5 rounded-xl bg-dairy-cream hover:bg-dairy-green hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-dairy-green border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dairy-border text-dairy-muted text-sm font-medium">
              No orders found matching filters.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const isV = ord.status === 'verification_pending';
                const isPaid = ord.status === 'paid';
                const isNewArrival = newOrderNumbers.has(ord.orderNumber);

                return (
                  <div
                    key={ord._id || ord.orderNumber}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                      isNewArrival
                        ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-400 animate-fadeIn'
                        : isV
                        ? 'border-amber-400 shadow-md ring-2 ring-amber-400/30'
                        : 'border-dairy-border shadow-dairy'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-dairy-border/60 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-dairy-green">
                            #{ord.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                        <p className="text-xs text-dairy-muted">
                          {new Date(ord.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>

                      {/* Customer Info */}
                      <div className="text-xs">
                        <p className="font-bold text-dairy-text">{ord.customerName}</p>
                        <p className="text-dairy-muted">
                          {ord.customerPhone} {ord.altPhone ? `· Alt: ${ord.altPhone}` : ''}
                        </p>
                        <p className="text-dairy-muted text-[11px] truncate max-w-sm">
                          {ord.deliveryAddress}
                        </p>
                      </div>

                      {/* Total & UTR */}
                      <div className="text-right">
                        <p className="font-black text-lg text-dairy-green">₹{ord.total}</p>
                        {ord.utr ? (
                          <div className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                            <span>UTR: {ord.utr}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-dairy-muted">No UTR submitted</span>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="py-3 flex flex-wrap gap-2 text-xs">
                      {ord.items.map((i, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-dairy-cream/60 border border-dairy-border/60 text-dairy-text font-medium"
                        >
                          {i.name_en} ({i.sizeLabel_en}) × {i.quantity} = ₹{i.price}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-dairy-border/50">
                      {actionLoadingId === ord.orderNumber && (
                        <span className="text-xs text-dairy-muted flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…
                        </span>
                      )}

                      {/* Verification buttons */}
                      {(ord.status === 'verification_pending' ||
                        ord.status === 'pending_payment' ||
                        ord.status === 'rejected') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(ord.orderNumber, 'verify_payment')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify Payment (Mark Paid)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Reason for rejection (optional):');
                              handleOrderAction(ord.orderNumber, 'reject_payment', {
                                reason: reason || '',
                              });
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* Lifecycle Status dropdown */}
                      {ord.status !== 'cancelled' && (
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleOrderAction(ord.orderNumber, 'update_status', {
                              status: e.target.value,
                            })
                          }
                          className="px-3 py-2 rounded-xl border border-dairy-border text-xs font-bold text-dairy-text bg-white"
                        >
                          <option value="pending_payment">Status: Pending</option>
                          <option value="verification_pending">Status: Verifying</option>
                          <option value="paid">Status: Paid</option>
                          <option value="preparing">Status: Preparing</option>
                          <option value="out_for_delivery">Status: Out for Delivery</option>
                          <option value="delivered">Status: Delivered</option>
                          <option value="rejected">Status: Rejected</option>
                          <option value="cancelled">Status: Cancelled</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-dairy-green">
              Catalog Items ({products.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingProduct({
                  id: '',
                  name_en: '',
                  name_pa: '',
                  description_en: '',
                  description_pa: '',
                  category: 'ghee',
                  price_primary: 500,
                  price_half: 250,
                  primary_unit_label_en: '1 kg',
                  primary_unit_label_pa: '1 ਕਿੱਲੋ',
                  half_unit_label_en: '500 g',
                  half_unit_label_pa: '500 ਗ੍ਰਾਮ',
                  has_half: true,
                  image: '/images/products/ghee-cow.jpg',
                  is_bestseller: false,
                  inStock: true,
                  discontinued: false,
                });
                setIsNewProduct(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {productsLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-dairy-green border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-5 border flex flex-col justify-between space-y-4 shadow-dairy ${
                    p.discontinued
                      ? 'opacity-60 border-dashed border-gray-400'
                      : !p.inStock
                      ? 'border-amber-300'
                      : 'border-dairy-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-dairy-cream flex-shrink-0 border border-dairy-border">
                      <Image src={p.image} alt={p.name_en} fill className="object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-dairy-text truncate">{p.name_en}</h3>
                        {p.discontinued && (
                          <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 text-[10px]">
                            Discontinued
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dairy-maroon font-medium">{p.name_pa}</p>
                      <p className="font-black text-sm text-dairy-green mt-1">
                        ₹{p.price_primary}
                        <span className="text-xs font-normal text-dairy-muted">
                          {' '}
                          / {p.primary_unit_label_en}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Stock & Discontinue Toggles */}
                  <div className="pt-3 border-t border-dairy-border/50 flex items-center justify-between text-xs">
                    {/* In Stock toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStock(p)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        p.inStock
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {p.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                    </button>

                    {/* Discontinue toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleDiscontinued(p)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        p.discontinued
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.discontinued ? 'Restore' : 'Discontinue'}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p);
                        setIsNewProduct(false);
                      }}
                      className="p-1.5 rounded-lg text-dairy-green hover:bg-dairy-green/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT EDIT / ADD MODAL ────────────────────────────────────────── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl my-8">
            <h3 className="font-serif text-xl font-bold text-dairy-green-dark">
              {isNewProduct ? 'Add New Product' : `Edit Product: ${editingProduct.name_en}`}
            </h3>

            {productFormError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {productFormError}
              </p>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">English Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name_en}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name_en: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Punjabi Name</label>
                  <input
                    type="text"
                    value={editingProduct.name_pa || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name_pa: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Category *</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs bg-white"
                  >
                    <option value="ghee">Ghee</option>
                    <option value="paneer">Paneer</option>
                    <option value="khoya">Khoya</option>
                    <option value="milk">Milk</option>
                    <option value="dahi">Dahi (Curd)</option>
                    <option value="lassi">Lassi</option>
                    <option value="house-special">House Special</option>
                    <option value="white-butter">White Butter</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Primary Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.price_primary}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price_primary: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Primary Unit Label</label>
                  <input
                    type="text"
                    value={editingProduct.primary_unit_label_en}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        primary_unit_label_en: e.target.value,
                      })
                    }
                    placeholder="e.g. 1 kg"
                    className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Half Price (optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.price_half ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price_half: e.target.value ? Number(e.target.value) : undefined,
                        has_half: Boolean(e.target.value),
                      })
                    }
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
                  />
                </div>
              </div>

              {/* Photo Upload or URL */}
              <div className="space-y-2">
                <label className="font-bold block">Product Photo (URL or Upload) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editingProduct.image}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image: e.target.value })
                    }
                    placeholder="e.g. /images/products/ghee-cow.jpg or https://..."
                    className="flex-1 px-3 py-2 rounded-xl border border-dairy-border text-xs"
                  />
                  <label className="px-3 py-2 rounded-xl bg-dairy-cream hover:bg-dairy-green hover:text-white cursor-pointer font-bold flex items-center gap-1 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading…' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Description (English) *</label>
                <textarea
                  rows={2}
                  required
                  value={editingProduct.description_en}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description_en: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, inStock: e.target.checked })
                    }
                    className="w-4 h-4 text-dairy-green rounded"
                  />
                  <span>In Stock</span>
                </label>

                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_bestseller || false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_bestseller: e.target.checked })
                    }
                    className="w-4 h-4 text-dairy-green rounded"
                  />
                  <span>Bestseller</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dairy-border">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-dairy-border hover:bg-gray-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
