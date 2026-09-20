'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import {
  ShieldCheck,
  QrCode,
  ArrowRight,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { items, subtotal, deliveryFee, isFreeDelivery, discounts, grandTotal, clearCart } =
    useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [houseStreet, setHouseStreet] = useState('');
  const [areaMohalla, setAreaMohalla] = useState('');
  const [landmark, setLandmark] = useState('');
  const city = 'Kotkapura';
  const state = 'Punjab';
  const [isKotkapuraConfirmed, setIsKotkapuraConfirmed] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [rememberDetails, setRememberDetails] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kakria_guest_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.altPhone) setAltPhone(parsed.altPhone);
        if (parsed.houseStreet) setHouseStreet(parsed.houseStreet);
        if (parsed.areaMohalla) setAreaMohalla(parsed.areaMohalla);
        if (parsed.landmark) setLandmark(parsed.landmark);
      }
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="py-20 px-4 max-w-lg mx-auto text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-dairy-green">{t('cart_empty')}</h2>
        <p className="text-sm text-dairy-muted">
          {language === 'en'
            ? 'Please add products before checking out.'
            : 'ਚੈੱਕਆਉਟ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕਾਰਟ ਵਿੱਚ ਉਤਪਾਦ ਸ਼ਾਮਲ ਕਰੋ।'}
        </p>
        <Link
          href="/categories"
          className="inline-block px-6 py-3 rounded-xl bg-dairy-green text-white font-bold text-sm shadow-md"
        >
          {t('shop_now')}
        </Link>
      </div>
    );
  }

  const validateForm = () => {
    if (!fullName.trim() || !phone.trim() || !houseStreet.trim() || !areaMohalla.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Please fill in all required fields (Name, Phone, House/Street, Area/Mohalla).'
          : 'ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਲੋੜੀਂਦੇ ਖਾਨੇ ਭਰੋ (ਨਾਮ, ਫ਼ੋਨ, ਮਕਾਨ/ਗਲੀ, ਇਲਾਕਾ/ਮੁਹੱਲਾ)।'
      );
      return false;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter a valid 10-digit contact number.'
          : 'ਕਿਰਪਾ ਕਰਕੇ 10 ਅੰਕਾਂ ਵਾਲਾ ਸਹੀ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।'
      );
      return false;
    }
    if (!isKotkapuraConfirmed) {
      setErrorMessage(
        language === 'en'
          ? 'Sorry, we deliver only within Kotkapura town. Please confirm your delivery address.'
          : 'ਮਾਫ਼ ਕਰਨਾ, ਅਸੀਂ ਸਿਰਫ਼ ਕੋਟਕਪੂਰਾ ਸ਼ਹਿਰ ਵਿੱਚ ਹੀ ਡਿਲੀਵਰੀ ਕਰਦੇ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।'
      );
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      if (rememberDetails) {
        try {
          localStorage.setItem(
            'kakria_guest_details',
            JSON.stringify({
              fullName: fullName.trim(),
              phone: phone.trim(),
              altPhone: altPhone.trim(),
              houseStreet: houseStreet.trim(),
              areaMohalla: areaMohalla.trim(),
              landmark: landmark.trim(),
            })
          );
        } catch {
          // ignore
        }
      }

      const payload = {
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        altPhone: altPhone.trim(),
        houseStreet: houseStreet.trim(),
        areaMohalla: areaMohalla.trim(),
        landmark: landmark.trim(),
        city,
        state,
        isKotkapuraConfirmed: true,
        orderNotes: orderNotes.trim(),
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create order. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Order created with status "pending_payment"
      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch (err) {
      setErrorMessage('Network error while placing order. Please check your connection.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-dairy-green-dark">
          {t('checkout_title')}
        </h1>
        <p className="text-xs sm:text-sm text-dairy-muted mt-1">{t('checkout_sub')}</p>
      </div>

      {/* Delivery Area Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-sm">
        <span className="text-base">📍</span>
        <span>Delivery only within Kotkapura town (No nearby villages or outer towns).</span>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Customer Details ────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border/80 shadow-dairy space-y-6">
            <h2 className="font-serif text-xl font-bold text-dairy-green">{t('customer_info')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-dairy-text mb-1.5">{t('full_name')} *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Gurpreet Singh' : 'ਜਿਵੇਂ: ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ'}
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dairy-text mb-1.5">{t('phone')} *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dairy-text mb-1.5">{t('alt_phone')}</label>
                <input
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="Optional alternate contact"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-dairy-text mb-1.5">House / Flat No. & Street *</label>
                <input
                  type="text"
                  required
                  value={houseStreet}
                  onChange={(e) => setHouseStreet(e.target.value)}
                  placeholder="e.g. H.No 124, Gali No. 3"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dairy-text mb-1.5">Area / Mohalla *</label>
                <input
                  type="text"
                  required
                  value={areaMohalla}
                  onChange={(e) => setAreaMohalla(e.target.value)}
                  placeholder="e.g. Main Bazaar / Prem Nagar"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dairy-text mb-1.5">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Gurudwara Patshahi Dasvi"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dairy-text mb-1.5">City (Delivery Area)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value="Kotkapura"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-stone-100 text-stone-700 font-bold text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dairy-text mb-1.5">State</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value="Punjab"
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-stone-100 text-stone-700 font-bold text-sm cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-dairy-text mb-1.5">{t('order_notes')}</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Deliver before 10 AM' : 'ਜਿਵੇਂ: ਸਵੇਰੇ 10 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ'}
                  className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
                />
              </div>

              {/* Required Town Confirmation Checkbox */}
              <div className="sm:col-span-2 pt-1 p-3.5 rounded-xl bg-amber-50/80 border border-amber-300">
                <label className="flex items-start gap-2.5 text-xs font-extrabold text-amber-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={isKotkapuraConfirmed}
                    onChange={(e) => setIsKotkapuraConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-dairy-green focus:ring-dairy-green border-amber-400"
                  />
                  <span>
                    I confirm my delivery address is inside Kotkapura town.
                  </span>
                </label>
              </div>

              {/* Remember details on device */}
              <div className="sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-dairy-text/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDetails}
                    onChange={(e) => setRememberDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-dairy-green focus:ring-dairy-green border-dairy-border"
                  />
                  <span>
                    {language === 'en'
                      ? 'Remember my delivery details on this device for future orders'
                      : 'ਅਗਲੇ ਆਰਡਰਾਂ ਲਈ ਮੇਰੇ ਵੇਰਵੇ ਇਸ ਡਿਵਾਈਸ \'ਤੇ ਯਾਦ ਰੱਖੋ'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Payment Method Notice (Pure Dynamic UPI QR) ────────────────── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border/80 shadow-dairy space-y-4">
            <h2 className="font-serif text-xl font-bold text-dairy-green">{t('payment_method')}</h2>

            <div className="p-5 rounded-2xl border-2 border-dairy-green bg-dairy-green/5 shadow-sm space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-dairy-green text-white flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-dairy-text">
                    {language === 'en' ? 'Dynamic UPI QR Code Payment' : 'ਡਾਇਨਾਮਿਕ UPI QR ਕੋਡ ਭੁਗਤਾਨ'}
                  </h4>
                  <p className="text-xs text-dairy-muted mt-0.5">
                    {language === 'en'
                      ? 'On clicking Place Order, an order-specific dynamic QR code will appear with the exact amount. Pay via GPay, PhonePe, or Paytm.'
                      : 'ਆਰਡਰ ਦਰਜ ਕਰਨ \'ਤੇ ਤੁਹਾਡੇ ਆਰਡਰ ਦਾ ਡਾਇਨਾਮਿਕ QR ਕੋਡ ਬਣੇਗਾ ਜਿਸ ਨੂੰ ਸਕੈਨ ਕਰਕੇ ਤੁਸੀਂ ਕਿਸੇ ਵੀ UPI ਐਪ ਨਾਲ ਭੁਗਤਾਨ ਕਰ ਸਕਦੇ ਹੋ।'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Order Summary ───────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border/80 shadow-dairy space-y-6">
          <h2 className="font-serif text-xl font-bold text-dairy-green border-b border-dairy-border/60 pb-3">
            {t('order_summary')}
          </h2>

          {/* Items List */}
          <div className="divide-y divide-dairy-border/50 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-dairy-cream flex-shrink-0">
                    <Image src={item.image} alt={item.name_en} fill className="object-contain p-0.5" />
                  </div>
                  <div>
                    <p className="font-bold text-dairy-text">
                      {language === 'en' ? item.name_en : item.name_pa}
                    </p>
                    <p className="text-[11px] text-dairy-muted">
                      {item.quantity} × {language === 'en' ? item.sizeLabel_en : item.sizeLabel_pa}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-dairy-green">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-3 pt-3 border-t border-dairy-border/80 text-xs sm:text-sm">
            <div className="flex justify-between text-dairy-text">
              <span>{t('subtotal')}</span>
              <span className="font-bold">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-dairy-text">
              <div className="flex items-center gap-1.5">
                <span>{t('delivery_fee')}</span>
                {isFreeDelivery && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {t('free_delivery_badge')}
                  </span>
                )}
              </div>
              <span className="font-bold">
                {isFreeDelivery ? <span className="text-emerald-700">₹0</span> : `₹${deliveryFee}`}
              </span>
            </div>
            {discounts.totalDiscount > 0 && (
              <div className="flex justify-between text-dairy-maroon font-bold pt-1 border-t border-dashed border-dairy-border">
                <span>{t('total_savings')}</span>
                <span>-₹{discounts.totalDiscount}</span>
              </div>
            )}
            <div className="pt-3 border-t border-dairy-border flex items-baseline justify-between">
              <span className="font-serif text-lg font-bold text-dairy-green-dark">{t('grand_total')}</span>
              <span className="text-2xl font-black text-dairy-green">₹{grandTotal}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 px-6 rounded-2xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60"
          >
            {isProcessing ? (
              <span>{language === 'en' ? 'Generating Order QR…' : 'ਆਰਡਰ ਦਰਜ ਹੋ ਰਿਹਾ ਹੈ…'}</span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-dairy-gold" />
                <span>
                  {language === 'en' ? `Place Order & Pay ₹${grandTotal}` : `ਆਰਡਰ ਦਰਜ ਕਰੋ ਅਤੇ ₹${grandTotal} ਪੇ ਕਰੋ`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-dairy-muted flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck className="w-4 h-4 text-dairy-gold" />
            <span>{t('self_made_badge')} • 100% Traditional Quality Guaranteed</span>
          </p>
        </div>
      </form>
    </div>
  );
}
