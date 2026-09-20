'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  ArrowRight,
  ShieldCheck,
  Tag,
  Sparkles,
} from 'lucide-react';

export default function CartPage() {
  const { language, t } = useLanguage();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    isFreeDelivery,
    amountNeededForFreeDelivery,
    discounts,
    grandTotal,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-20 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-dairy-green/10 text-dairy-green mx-auto flex items-center justify-center shadow-inner">
          <ShoppingBag className="w-12 h-12 text-dairy-green" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-dairy-green-dark">
            {t('cart_empty')}
          </h1>
          <p className="text-sm text-dairy-muted max-w-md mx-auto">
            {t('cart_empty_sub')}
          </p>
        </div>
        <div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-sm shadow-md transition-all"
          >
            <span>{t('shop_now')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Free delivery progress percentage
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / 300) * 100));

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dairy-border/80 pb-5">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-dairy-green-dark">
            {t('cart_title')}
          </h1>
          <p className="text-xs sm:text-sm text-dairy-muted mt-1">
            {language === 'en'
              ? `You have ${items.length} unique dairy selection(s) in your basket`
              : `ਤੁਹਾਡੇ ਕਾਰਟ ਵਿੱਚ ${items.length} ਤਰ੍ਹਾਂ ਦੇ ਉਤਪਾਦ ਹਨ`}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-dairy-muted hover:text-red-600 transition-colors self-start sm:self-auto"
        >
          {t('clear_cart')}
        </button>
      </div>

      {/* Delivery Area Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-sm">
        <span className="text-base">📍</span>
        <span>Delivery only within Kotkapura town (No nearby villages or outer towns).</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Delivery Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-dairy-border/80 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-dairy-gold" />
                {isFreeDelivery ? (
                  <span className="text-emerald-700">{t('free_delivery_qualified')}</span>
                ) : (
                  <span className="text-dairy-text">
                    {t('delivery_calc_note', { amount: amountNeededForFreeDelivery })}
                  </span>
                )}
              </div>
              <span className="text-dairy-gold font-extrabold">{freeDeliveryProgress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-dairy-cream-dark rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFreeDelivery ? 'bg-emerald-600' : 'bg-dairy-gold'
                }`}
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-3xl border border-dairy-border/80 shadow-dairy divide-y divide-dairy-border/50 overflow-hidden">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* Product Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-dairy-cream-dark flex-shrink-0 border border-dairy-border/60">
                    <Image
                      src={item.image}
                      alt={item.name_en}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-dairy-green">
                      {language === 'en' ? item.name_en : item.name_pa}
                    </h3>
                    <p className="text-xs text-dairy-maroon font-semibold">
                      {language === 'en' ? item.name_pa : item.name_en}
                    </p>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded bg-dairy-cream text-[11px] font-bold text-dairy-text/70 border border-dairy-border">
                      {language === 'en' ? item.sizeLabel_en : item.sizeLabel_pa}
                    </div>
                  </div>
                </div>

                {/* Quantity & Pricing Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-dairy-border/40">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-dairy-border rounded-xl bg-dairy-cream overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                      className="p-2 hover:bg-dairy-cream-dark text-dairy-green transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-xs font-bold text-dairy-text">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                      className="p-2 hover:bg-dairy-cream-dark text-dairy-green transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right min-w-[75px]">
                    <div className="text-base sm:text-lg font-black text-dairy-green">
                      ₹{item.unitPrice * item.quantity}
                    </div>
                    <div className="text-[11px] text-dairy-muted">
                      ₹{item.unitPrice} each
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId, item.size)}
                    className="p-2 text-dairy-muted hover:text-red-600 transition-colors"
                    title={t('remove')}
                    aria-label={t('remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-xs font-bold text-dairy-green hover:text-dairy-maroon transition-colors"
            >
              <span>← {t('continue_shopping')}</span>
            </Link>
          </div>
        </div>

        {/* Cart Summary & Checkout */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border/80 shadow-dairy space-y-6">
          <h2 className="font-serif text-xl font-bold text-dairy-green border-b border-dairy-border/60 pb-3">
            {t('cart_summary')}
          </h2>

          <div className="space-y-3.5 text-sm">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-dairy-text">
              <span>{t('subtotal')}</span>
              <span className="font-bold">₹{subtotal}</span>
            </div>

            {/* Delivery */}
            <div className="flex items-center justify-between text-dairy-text">
              <div className="flex items-center gap-1.5">
                <span>{t('delivery_fee')}</span>
                {isFreeDelivery && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {t('free_delivery_badge')}
                  </span>
                )}
              </div>
              <span className="font-bold">
                {isFreeDelivery ? (
                  <span className="text-emerald-700">₹0</span>
                ) : (
                  <span>₹{deliveryFee}</span>
                )}
              </span>
            </div>

            {/* Discounts Applied */}
            {discounts.totalDiscount > 0 && (
              <div className="pt-2 border-t border-dashed border-dairy-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-dairy-maroon">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{t('discounts_applied')}</span>
                </div>

                {discounts.hasGheeDiscount && (
                  <div className="flex items-center justify-between text-xs text-dairy-maroon">
                    <span>{t('discount_ghee')}</span>
                    <span className="font-bold">-₹{discounts.gheeDiscount}</span>
                  </div>
                )}

                {discounts.hasOrderDiscount && (
                  <div className="flex items-center justify-between text-xs text-dairy-maroon">
                    <span>{t('discount_bulk')}</span>
                    <span className="font-bold">-₹{discounts.orderDiscount}</span>
                  </div>
                )}

                {/* Explanation text */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
                  {language === 'en' ? discounts.explanation_en : discounts.explanation_pa}
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-4 border-t border-dairy-border flex items-baseline justify-between">
              <div>
                <span className="font-serif text-lg font-bold text-dairy-green-dark">
                  {t('grand_total')}
                </span>
                <p className="text-[10px] text-dairy-muted">
                  {language === 'en' ? 'Includes all applicable taxes' : 'ਸਾਰੇ ਟੈਕਸ ਸ਼ਾਮਲ ਹਨ'}
                </p>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-dairy-green tracking-tight">
                ₹{grandTotal}
              </span>
            </div>
          </div>

          {/* Checkout CTA Button */}
          <Link
            href="/checkout"
            className="w-full py-4 px-6 rounded-2xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <span>{t('checkout_btn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Guarantee pill */}
          <div className="flex items-center justify-center gap-2 text-center text-xs text-dairy-muted">
            <ShieldCheck className="w-4 h-4 text-dairy-gold" />
            <span>{t('self_made_sub')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
