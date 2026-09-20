import productsFallback from '@/data/products.json';

/**
 * In-memory fallback store for orders and products when MongoDB Atlas is unavailable or
 * when credentials are being set up.
 */

export interface InMemoryOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  houseStreet?: string;
  areaMohalla?: string;
  landmark?: string;
  city?: string;
  state?: string;
  deliveryAddress: string;
  pincode?: string;
  orderNotes?: string;
  items: any[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
  screenshotUrl?: string;
  paymentMethod: string;
  verifiedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryProduct {
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
  unit_type: string;
  has_half?: boolean;
  image: string;
  is_bestseller?: boolean;
  nutrition?: any;
  inStock: boolean;
  discontinued: boolean;
  [key: string]: any;
}

declare global {
  // eslint-disable-next-line no-var
  var __kakriaOrdersMemory: InMemoryOrder[] | undefined;
  // eslint-disable-next-line no-var
  var __kakriaProductsMemory: InMemoryProduct[] | undefined;
}

if (!global.__kakriaOrdersMemory) {
  global.__kakriaOrdersMemory = [];
}

if (!global.__kakriaProductsMemory) {
  global.__kakriaProductsMemory = (productsFallback as any[]).map((p) => ({
    ...p,
    name_pa: p.name_pa || '',
    description_pa: p.description_pa || '',
    primary_unit_label_en: p.primary_unit_label_en || '1 unit',
    primary_unit_label_pa: p.primary_unit_label_pa || '',
    half_unit_label_en: p.half_unit_label_en || '',
    half_unit_label_pa: p.half_unit_label_pa || '',
    unit_type: p.unit_type || 'piece',
    has_half: Boolean(p.has_half),
    is_bestseller: Boolean(p.is_bestseller),
    nutrition: p.nutrition || { fat: '—', carbs: '—', protein: '—', calories: '—' },
    inStock: true,
    discontinued: false,
  }));
}

import fs from 'fs';
import path from 'path';

function loadDiskOrders(): InMemoryOrder[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'orders.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[memoryStore] Failed to load disk orders:', err);
  }
  return [];
}

function saveDiskOrders(orders: InMemoryOrder[]) {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, 'orders.json');
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.warn('[memoryStore] Failed to save disk orders:', err);
  }
}

if (!global.__kakriaOrdersMemory || global.__kakriaOrdersMemory.length === 0) {
  global.__kakriaOrdersMemory = loadDiskOrders();
}

export const memoryOrders = global.__kakriaOrdersMemory;
export const memoryProducts = global.__kakriaProductsMemory;

export function addMemoryOrder(order: InMemoryOrder) {
  memoryOrders.unshift(order);
  saveDiskOrders(memoryOrders);
}

export function findMemoryOrder(orderNumber: string): InMemoryOrder | undefined {
  return memoryOrders.find((o) => o.orderNumber === orderNumber);
}

export function updateMemoryOrder(orderNumber: string, updates: Partial<InMemoryOrder>): InMemoryOrder | undefined {
  const order = findMemoryOrder(orderNumber);
  if (order) {
    Object.assign(order, updates, { updatedAt: new Date() });
    saveDiskOrders(memoryOrders);
  }
  return order;
}

export function getMemoryProducts(includeDiscontinued = false): InMemoryProduct[] {
  if (includeDiscontinued) {
    return [...memoryProducts];
  }
  return memoryProducts.filter((p) => !p.discontinued);
}

export function findMemoryProduct(id: string): InMemoryProduct | undefined {
  return memoryProducts.find((p) => p.id === id);
}

export function updateMemoryProduct(id: string, updates: Partial<InMemoryProduct>): InMemoryProduct | undefined {
  const prod = findMemoryProduct(id);
  if (prod) {
    Object.assign(prod, updates);
  }
  return prod;
}

export function addMemoryProduct(product: InMemoryProduct): void {
  const idx = memoryProducts.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    memoryProducts[idx] = product;
  } else {
    memoryProducts.push(product);
  }
}
