'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { UserOrder } from '@/context/AuthContext';
import {
  CheckCircle2,
  Printer,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { SHOP_PHONE_WA } from '@/lib/config';

const ADMIN_WA = SHOP_PHONE_WA;

// ── WhatsApp receipt builder ──────────────────────────────────────────────────
function buildWhatsAppText(order: UserOrder, extra: { altPhone: string; orderNotes: string }): string {
  const isPaid = order.paymentMethod === 'UPI QR';
  const isQR   = order.paymentMethod === 'UPI QR';

  const paymentLine = isQR
    ? `*PAYMENT STATUS: ✅ PAID (via UPI QR)*`
    : `*PAYMENT STATUS: 💵 CASH ON DELIVERY (Unpaid — collect ₹${order.total} on delivery)*`;

  const itemLines = order.items
    .map((i) => `  • ${i.name_en} (${i.size}) × ${i.quantity} = ₹${i.price}`)
    .join('\n');

  const discountLine = order.discount > 0 ? `\nDiscount Applied: -₹${order.discount}` : '';
  const deliveryLine = order.deliveryFee === 0 ? 'Delivery: FREE' : `Delivery: ₹${order.deliveryFee}`;
  const altPhoneLine = extra.altPhone ? `\nAlt. Number: ${extra.altPhone}` : '';
  const notesLine    = extra.orderNotes ? `\nDelivery Note: ${extra.orderNotes}` : '';

  return (
    `🥛 *KAKRIA DAIRY — New Order Receipt*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${paymentLine}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Order ID:* ${order.id}\n` +
    `*Date & Time:* ${order.date}\n\n` +
    `*Customer:* ${order.customerName}\n` +
    `*Contact:* ${order.customerPhone}${altPhoneLine}\n` +
    `*Delivery Address:* ${order.deliveryAddress}${notesLine}\n\n` +
    `*━ Items Ordered ━*\n` +
    `${itemLines}\n\n` +
    `Subtotal: ₹${order.subtotal}${discountLine}\n` +
    `${deliveryLine}\n` +
    `*TOTAL: ₹${order.total}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Since 2002 by DKK | Kotakpura, Punjab\n` +
    `Thank you for choosing Kakria Dairy! 🙏`
  );
}

function buildWaLink(order: UserOrder, extra: { altPhone: string; orderNotes: string }): string {
  const text = buildWhatsAppText(order, extra);
  return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function ConfirmationContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'KD-2002-88';

  const [order, setOrder] = useState<UserOrder | null>(null);
  const [extra, setExtra] = useState({ altPhone: '', orderNotes: '' });
  const [waOpened, setWaOpened] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('last_kakria_order');
      if (saved) setOrder(JSON.parse(saved));
      const savedExtra = sessionStorage.getItem('last_kakria_order_extra');
      if (savedExtra) setExtra(JSON.parse(savedExtra));
    } catch (e) {
      console.warn('Could not read order from sessionStorage', e);
    }
  }, []);

  // Auto-open WhatsApp once order data is loaded (on first render with data)
  const openWhatsApp = useCallback(() => {
    if (!order) return;
    const link = buildWaLink(order, extra);
    window.open(link, '_blank');
    setWaOpened(true);
  }, [order, extra]);

  useEffect(() => {
    if (order && !waOpened) {
      // Short delay so confirmation page renders first
      const timer = setTimeout(() => {
        openWhatsApp();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [order, waOpened, openWhatsApp]);

  const isQRPaid = order?.paymentMethod === 'UPI QR';
  const isCOD    = order?.paymentMethod === 'COD';

  // Payment status banner props
  const statusBg    = isQRPaid ? 'bg-emerald-600'   : 'bg-amber-500';
  const statusText  = isQRPaid
    ? `✅  PAYMENT STATUS: PAID (via UPI QR)`
    : `💵  PAYMENT STATUS: CASH ON DELIVERY — Unpaid (collect ₹${order?.total ?? '—'} on delivery)`;

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6 print:py-0 print:px-0">

      {/* ── Bold Payment Status Banner ──────────────────────────────────────── */}
      {order && (
        <div className={`${statusBg} text-white rounded-2xl px-6 py-4 text-center print:rounded-none`}>
          <p className="font-black text-base sm:text-lg tracking-wide leading-snug">
            {statusText}
          </p>
          {isCOD && (
            <p className="text-xs mt-1 font-semibold opacity-90">
              {language === 'en'
                ? 'Our delivery person will collect cash at your door.'
                : 'ਸਾਡਾ ਡਿਲੀਵਰੀ ਵਾਲਾ ਘਰ ਆ ਕੇ ਭੁਗਤਾਨ ਲਵੇਗਾ।'}
            </p>
          )}
        </div>
      )}

      {/* ── Confirmation Header ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-dairy-border/80 shadow-dairy text-center space-y-4 print:shadow-none print:border-none">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dairy-green/10 text-dairy-green text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-dairy-gold" />
            <span>{t('self_made_badge')}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-dairy-green-dark">
            {t('confirmation_title')}
          </h1>
          <p className="text-xs sm:text-sm text-dairy-muted">{t('confirmation_sub')}</p>
        </div>
        <div className="pt-2 inline-block px-4 py-2 rounded-xl bg-dairy-cream border border-dairy-border">
          <span className="text-xs text-dairy-muted">{t('order_id')}: </span>
          <span className="font-mono font-bold text-sm text-dairy-green">{orderId}</span>
        </div>
      </div>

      {/* ── Invoice / Receipt ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border/80 shadow-dairy space-y-6 print:shadow-none">

        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-dairy-border/70 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image src="/images/logo.svg" alt="Kakria Dairy" fill className="object-contain" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-dairy-green">{t('brand_name')}</h2>
              <p className="text-[11px] text-dairy-muted">{t('tagline')}</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-dairy-text">Deepak Kumar Kakria</p>
            <p className="text-dairy-muted">+91 98153 42224</p>
            <p className="text-dairy-muted">Kotakpura, Faridkot</p>
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-dairy-cream/40 p-4 rounded-2xl border border-dairy-border/60">
          <div>
            <p className="font-bold text-dairy-green mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('delivery_to')}</span>
            </p>
            <p className="font-semibold text-dairy-text">{order?.customerName ?? 'Valued Customer'}</p>
            <p className="text-dairy-muted">{order?.deliveryAddress ?? 'Kotakpura, Punjab'}</p>
            <p className="text-dairy-muted flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              {order?.customerPhone ?? '+91 9815342224'}
            </p>
            {extra.altPhone && (
              <p className="text-dairy-muted text-[11px]">Alt: {extra.altPhone}</p>
            )}
            {extra.orderNotes && (
              <p className="text-dairy-muted text-[11px] mt-1 italic">Note: {extra.orderNotes}</p>
            )}
          </div>
          <div>
            <p className="font-bold text-dairy-green mb-1">{t('payment_status')}</p>
            <p className={`font-black text-sm ${isQRPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
              {isQRPaid
                ? t('status_paid_qr')
                : t('status_cod')}
            </p>
            {isCOD && order && (
              <p className="text-amber-700 font-semibold text-[11px] mt-0.5">
                Collect ₹{order.total} on delivery
              </p>
            )}
            <p className="text-dairy-muted mt-1">Date: {order?.date ?? new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-serif text-sm font-bold text-dairy-green border-b border-dairy-border/50 pb-2">
            {language === 'en' ? 'Purchased Dairy Products' : 'ਖ਼ਰੀਦੇ ਗਏ ਡੇਅਰੀ ਉਤਪਾਦ'}
          </h3>
          <div className="divide-y divide-dairy-border/40 text-xs">
            {order?.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-dairy-text">
                      {language === 'en' ? item.name_en : item.name_pa}
                    </span>
                    <span className="text-dairy-muted ml-2">({item.size})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-dairy-muted font-mono">×{item.quantity}</span>
                    <span className="font-bold text-dairy-green min-w-[50px] text-right">₹{item.price}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 text-dairy-muted">Fresh Kakria Dairy Products</div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-2 pt-3 border-t border-dairy-border text-xs sm:text-sm">
          <div className="flex justify-between text-dairy-muted">
            <span>{t('subtotal')}</span>
            <span className="font-bold text-dairy-text">₹{order?.subtotal ?? '—'}</span>
          </div>
          <div className="flex justify-between text-dairy-muted">
            <span>{t('delivery_fee')}</span>
            <span className="font-bold text-dairy-text">
              {order?.deliveryFee === 0 ? 'FREE' : `₹${order?.deliveryFee ?? 0}`}
            </span>
          </div>
          {order && order.discount > 0 && (
            <div className="flex justify-between text-dairy-maroon font-bold">
              <span>{t('total_savings')}</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
          <div className="pt-3 border-t border-dairy-border flex items-baseline justify-between font-serif">
            <span className="text-base font-bold text-dairy-green-dark">{t('grand_total')}</span>
            <span className="text-2xl font-black text-dairy-green">₹{order?.total ?? '—'}</span>
          </div>
        </div>

        {/* Footer note */}
        <div className="p-3 bg-dairy-cream/60 rounded-xl text-[11px] text-dairy-muted text-center leading-snug">
          {t('bottom_bar')} • {t('contact_hours')}
        </div>
      </div>

      {/* ── WhatsApp Receipt Button ─────────────────────────────────────────── */}
      {order && (
        <div className="bg-[#25D366]/10 border-2 border-[#25D366]/40 rounded-2xl p-5 space-y-3 print:hidden">
          <p className="text-xs text-center text-dairy-muted font-semibold">
            {t('whatsapp_send_note')}
          </p>
          <button
            type="button"
            onClick={openWhatsApp}
            className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5e] text-white font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{t('whatsapp_send_btn')}</span>
          </button>
          {waOpened && (
            <p className="text-[11px] text-center text-emerald-700 font-semibold">
              {language === 'en'
                ? '✅ WhatsApp opened — just tap Send!'
                : '✅ WhatsApp ਖੁੱਲ੍ਹ ਗਈ — ਭੇਜੋ ਦਬਾਓ!'}
            </p>
          )}
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
        <Link
          href={`/order/${orderId}`}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-dairy-gold hover:bg-dairy-gold-light text-dairy-green-dark font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <span>Track Live Status & Enter UTR</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-dairy-border bg-white hover:bg-dairy-cream font-bold text-xs text-dairy-green flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>{t('print_receipt')}</span>
        </button>
        <Link
          href="/categories"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <span>{t('continue_shopping')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-dairy-green font-bold">Loading Order Details…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
