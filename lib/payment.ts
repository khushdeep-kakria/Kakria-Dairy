import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  upiId: string;
  payeeName: string;
  amount: number;
  orderNumber: string;
}

/**
 * Builds the standard UPI deep-link URL.
 * format: upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&am=${amount}&cu=INR&tn=${orderNumber}
 */
export function generateUpiUrl(details: UpiPaymentDetails): string {
  const upiId = details.upiId || process.env.UPI_ID || '9915433324@naviaxis';
  const payeeName = details.payeeName || process.env.PAYEE_NAME || 'Kakria Dairy';
  const formattedAmount = details.amount.toFixed(2);
  const transactionNote = details.orderNumber;

  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: formattedAmount,
    cu: 'INR',
    tn: transactionNote,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates a dynamic QR code Data URL (PNG) for an order
 */
export async function generateUpiQrDataUrl(details: UpiPaymentDetails): Promise<string> {
  const upiUrl = generateUpiUrl(details);
  return await QRCode.toDataURL(upiUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#113821', // Dark Forest Green for crisp branding
      light: '#ffffff',
    },
  });
}

/**
 * Helper to build pre-filled WhatsApp message for screenshot delivery to UNCLE_WHATSAPP
 */
/**
 * Helper to build pre-filled WhatsApp message for screenshot delivery to UNCLE_WHATSAPP
 */
import { SHOP_PHONE_WA } from './config';

export function generateWhatsAppPaymentLink(params: {
  orderNumber: string;
  customerName: string;
  amount: number;
  phone?: string;
  address?: string;
  pincode?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}): string {
  const adminPhone = (process.env.UNCLE_WHATSAPP || SHOP_PHONE_WA).replace(/\D/g, '');
  const internationalNumber = adminPhone.startsWith('91') ? adminPhone : `91${adminPhone}`;

  let itemsText = '';
  if (Array.isArray(params.items) && params.items.length > 0) {
    itemsText = '\n' + params.items.map((i, idx) => `${idx + 1}. ${i.name} x${i.quantity} = ₹${i.price}`).join('\n');
  }

  const addressText = `${params.address || 'Kotakpura'}${params.pincode ? `, ${params.pincode}` : ''}`;

  const message =
    `🧾 New Order #${params.orderNumber}\n` +
    `Name: ${params.customerName}\n` +
    `Phone: ${params.phone || ''}\n` +
    `Address: ${addressText}\n` +
    `Items:\n${itemsText || '1. Dairy Items'}\n` +
    `Total: ₹${params.amount}\n` +
    `Payment: UPI - screenshot uploaded`;

  return `https://wa.me/${internationalNumber || SHOP_PHONE_WA}?text=${encodeURIComponent(message)}`;
}

/**
 * Extensible interface for future payment gateways (Razorpay, Cashfree, etc.)
 */
export interface PaymentGatewayProvider {
  createPaymentOrder?(order: { orderNumber: string; amount: number }): Promise<any>;
  verifyWebhookSignature?(payload: any, signature: string): Promise<boolean>;
}
