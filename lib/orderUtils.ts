import { SHOP_PHONE_WA } from './config';

export interface OrderAddressInput {
  houseStreet?: string;
  areaMohalla?: string;
  landmark?: string;
  city?: string;
  state?: string;
  deliveryAddress?: string;
}

export function formatAddress(order: OrderAddressInput): string {
  const parts: string[] = [];
  if (order.houseStreet && order.houseStreet.trim()) {
    parts.push(order.houseStreet.trim());
  }
  if (order.areaMohalla && order.areaMohalla.trim()) {
    parts.push(order.areaMohalla.trim());
  }
  if (order.landmark && order.landmark.trim()) {
    parts.push(order.landmark.trim());
  }

  if (parts.length === 0 && order.deliveryAddress && order.deliveryAddress.trim()) {
    return order.deliveryAddress.trim();
  }

  const city = order.city?.trim() || 'Kotkapura';
  const state = order.state?.trim() || 'Punjab';
  parts.push(city);
  parts.push(state);

  return parts.join(', ');
}

export interface OrderReceiptItem {
  name_en?: string;
  name?: string;
  productName?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
}

export interface OrderReceiptInput extends OrderAddressInput {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderReceiptItem[];
  total: number;
  screenshotUrl?: string;
}

export function buildReceipt(order: OrderReceiptInput): string {
  const address = formatAddress(order);
  const itemsLines = (order.items || [])
    .map((item, idx) => {
      const name = item.name_en || item.name || item.productName || 'Dairy Item';
      const qty = item.quantity || 1;
      const lineTotal = item.price ?? ((item.unitPrice || 0) * qty);
      return `${idx + 1}. ${name} x${qty} = ₹${lineTotal}`;
    })
    .join('\n');

  let text = `🧾 New Order #${order.orderNumber}
Name: ${order.customerName}
Phone: ${order.customerPhone}
Address: ${address}
Items:
${itemsLines || '1. Dairy Items'}
Total: ₹${order.total}
Payment: UPI - Payment Screenshot Attached ✅`;

  if (order.screenshotUrl) {
    text += `\nPayment Proof: ${order.screenshotUrl.startsWith('http') ? order.screenshotUrl : 'Attached in this chat'}`;
  }

  return text;
}

export function buildWhatsAppLink(order: OrderReceiptInput, phoneOverride?: string): string {
  const receipt = buildReceipt(order);
  const rawPhone = phoneOverride || process.env.UNCLE_WHATSAPP || SHOP_PHONE_WA;
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const internationalNumber = digitsOnly.startsWith('91') ? digitsOnly : `91${digitsOnly}`;
  return `https://wa.me/${internationalNumber || SHOP_PHONE_WA}?text=${encodeURIComponent(receipt)}`;
}
