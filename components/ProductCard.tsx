'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShieldCheck,
  Flame,
  Shield,
  Edit2,
  Camera,
  RefreshCw,
  EyeOff,
} from 'lucide-react';
import { compressScreenshot } from '@/lib/imageCompressor';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { items, addToCart, updateQuantity } = useCart();
  const { isAdmin, setEditingProduct, triggerProductsRefresh } = useAuth();

  const [selectedSize, setSelectedSize] = useState<'full' | 'half'>('full');
  const [showNutrition, setShowNutrition] = useState(false);

  // Admin inline controls state
  const [inStock, setInStock] = useState(product.inStock !== false);
  const [discontinued, setDiscontinued] = useState(Boolean(product.discontinued));
  const [editPrice, setEditPrice] = useState(product.price_primary);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [togglingStock, setTogglingStock] = useState(false);
  const [togglingDiscontinue, setTogglingDiscontinue] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setInStock(product.inStock !== false);
    setDiscontinued(Boolean(product.discontinued));
    setEditPrice(product.price_primary);
  }, [product]);

  const isHalf = selectedSize === 'half' && product.has_half;
  const currentPrice = isHalf && product.price_half ? product.price_half : product.price_primary;
  const isOutOfStock = !inStock;

  // Find quantity of current product & selectedSize in cart
  const cartItem = items.find((i) => i.productId === product.id && i.size === selectedSize);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleSavePrice = async () => {
    if (savingPrice) return;
    setSavingPrice(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_primary: Number(editPrice) }),
      });
      if (res.ok) {
        setPriceSaved(true);
        setTimeout(() => setPriceSaved(false), 2000);
        triggerProductsRefresh();
      } else {
        alert('Failed to update price');
      }
    } catch {
      alert('Error saving price');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleToggleStock = async () => {
    if (togglingStock) return;
    setTogglingStock(true);
    const newStock = !inStock;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: newStock }),
      });
      if (res.ok) {
        setInStock(newStock);
        triggerProductsRefresh();
      } else {
        alert('Failed to toggle stock');
      }
    } catch {
      alert('Error updating stock');
    } finally {
      setTogglingStock(false);
    }
  };

  const handleToggleDiscontinue = async () => {
    if (togglingDiscontinue) return;
    setTogglingDiscontinue(true);
    const newDiscontinued = !discontinued;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discontinued: newDiscontinued }),
      });
      if (res.ok) {
        setDiscontinued(newDiscontinued);
        triggerProductsRefresh();
      } else {
        alert('Failed to update discontinued status');
      }
    } catch {
      alert('Error updating product');
    } finally {
      setTogglingDiscontinue(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressed = await compressScreenshot(file);
      const formData = new FormData();
      formData.append('file', compressed);

      const uploadRes = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.url) {
        const updateRes = await fetch(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: uploadData.url }),
        });
        if (updateRes.ok) {
          triggerProductsRefresh();
        } else {
          alert('Failed to link new image to product');
        }
      } else {
        alert(uploadData.error || 'Photo upload failed');
      }
    } catch {
      alert('Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div
      className={`group bg-white rounded-2xl border border-dairy-border/80 shadow-dairy hover:shadow-dairy-hover transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 ${
        discontinued ? 'opacity-70 border-dashed border-rose-300 bg-stone-50' : ''
      }`}
    >
      {/* Card Header & Image */}
      <div className="relative w-full aspect-[4/3] bg-white overflow-hidden">
        <Image
          src={getOptimizedImageUrl(product.image, 500)}
          alt={language === 'en' ? product.name_en : product.name_pa || product.name_en}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-contain group-hover:scale-105 transition-transform duration-500 p-2 ${
            discontinued ? 'grayscale' : ''
          }`}
        />

        {/* Self-Made Trust Badge */}
        <div className="absolute top-3 left-3 bg-dairy-green text-dairy-cream px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-md flex items-center gap-1.5 border border-dairy-gold/40">
          <ShieldCheck className="w-3.5 h-3.5 text-dairy-gold" />
          <span>{t('self_made_badge')}</span>
        </div>

        {/* Discontinued Badge */}
        {discontinued && (
          <div className="absolute top-3 right-3 bg-rose-700 text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 border border-rose-500">
            <span>Discontinued</span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {!discontinued && isOutOfStock && (
          <div className="absolute top-3 right-3 bg-stone-800 text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 border border-stone-600">
            <span>{language === 'en' ? 'Out of Stock' : 'ਸਟਾਕ ਖ਼ਤਮ'}</span>
          </div>
        )}

        {/* Bestseller Badge */}
        {!isOutOfStock && product.is_bestseller && (
          <div className="absolute top-3 right-3 bg-dairy-maroon text-white px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
            <Flame className="w-3 h-3 text-dairy-gold" />
            <span>Bestseller</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Bilingual Title */}
          <div className="space-y-0.5 mb-1.5">
            <h3 className="font-serif text-lg font-bold text-dairy-green group-hover:text-dairy-green-dark transition-colors">
              {language === 'en' ? product.name_en : product.name_pa}
            </h3>
            <p className="text-xs font-semibold text-dairy-maroon">
              {language === 'en' ? product.name_pa : product.name_en}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-dairy-muted line-clamp-2 leading-relaxed">
            {language === 'en' ? product.description_en : product.description_pa}
          </p>
        </div>

        {/* Size Selection & Pricing */}
        <div className="space-y-3 pt-2 border-t border-dairy-border/50">
          {/* Size Selector if product has half option */}
          {product.has_half ? (
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-dairy-text/70">{t('select_size')}</span>
              <div className="inline-flex rounded-lg border border-dairy-border p-0.5 bg-dairy-cream">
                <button
                  type="button"
                  onClick={() => setSelectedSize('full')}
                  className={`px-2.5 py-1 min-h-[36px] rounded-md font-semibold transition-colors ${
                    selectedSize === 'full'
                      ? 'bg-dairy-green text-white shadow-sm'
                      : 'text-dairy-text/80 hover:text-dairy-green'
                  }`}
                >
                  {language === 'en' ? product.primary_unit_label_en : product.primary_unit_label_pa}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSize('half')}
                  className={`px-2.5 py-1 min-h-[36px] rounded-md font-semibold transition-colors ${
                    selectedSize === 'half'
                      ? 'bg-dairy-green text-white shadow-sm'
                      : 'text-dairy-text/80 hover:text-dairy-green'
                  }`}
                >
                  {language === 'en' ? product.half_unit_label_en : product.half_unit_label_pa}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-dairy-muted">
              <span className="font-semibold text-dairy-text/70">{t('select_size')} </span>
              <span className="font-bold text-dairy-green">
                {language === 'en' ? product.primary_unit_label_en : product.primary_unit_label_pa}
              </span>
            </div>
          )}

          {/* Price Display */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-dairy-green tracking-tight">
                ₹{currentPrice}
              </span>
              <span className="text-xs text-dairy-muted">
                / {isHalf
                  ? (language === 'en' ? product.half_unit_label_en : product.half_unit_label_pa)
                  : (language === 'en' ? product.primary_unit_label_en : product.primary_unit_label_pa)}
              </span>
            </div>
          </div>

          {/* Expandable Nutrition Accordion */}
          {product.nutrition && (
            <div className="rounded-lg bg-dairy-cream/60 border border-dairy-border/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowNutrition(!showNutrition)}
                className="w-full px-3 py-2 text-[11px] font-semibold text-dairy-green flex items-center justify-between hover:bg-dairy-cream transition-colors"
              >
                <span>{t('nutrition_toggle')}</span>
                {showNutrition ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showNutrition && (
                <div className="p-2.5 border-t border-dairy-border/40 grid grid-cols-4 gap-1 text-center bg-white">
                  <div className="p-1 rounded bg-dairy-cream">
                    <div className="text-[10px] text-dairy-muted">{t('nutrition_fat')}</div>
                    <div className="text-xs font-bold text-dairy-text">{product.nutrition.fat}</div>
                  </div>
                  <div className="p-1 rounded bg-dairy-cream">
                    <div className="text-[10px] text-dairy-muted">{t('nutrition_protein')}</div>
                    <div className="text-xs font-bold text-dairy-text">{product.nutrition.protein}</div>
                  </div>
                  <div className="p-1 rounded bg-dairy-cream">
                    <div className="text-[10px] text-dairy-muted">{t('nutrition_carbs')}</div>
                    <div className="text-xs font-bold text-dairy-text">{product.nutrition.carbs}</div>
                  </div>
                  <div className="p-1 rounded bg-dairy-cream">
                    <div className="text-[10px] text-dairy-muted">{t('nutrition_calories')}</div>
                    <div className="text-xs font-bold text-dairy-text">{product.nutrition.calories}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cart Action: Button or Stepper ─────────────────────────────── */}
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
            >
              <span>{language === 'en' ? 'Out of Stock' : 'ਸਟਾਕ ਖ਼ਤਮ'}</span>
            </button>
          ) : cartQty === 0 ? (
            <button
              type="button"
              onClick={() => addToCart(product, selectedSize, 1)}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 bg-dairy-green text-white hover:bg-dairy-green-dark hover:shadow-md active:scale-95 transition-all shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-dairy-gold" />
              <span>{t('add_to_cart')}</span>
            </button>
          ) : (
            <div className="w-full min-h-[44px] flex items-center justify-between rounded-xl bg-dairy-green text-white px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={() => updateQuantity(product.id, selectedSize, cartQty - 1)}
                className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg bg-dairy-green-dark hover:bg-dairy-gold hover:text-dairy-green-dark flex items-center justify-center text-xl font-black transition-all active:scale-90"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <div className="flex flex-col items-center">
                <span className="font-mono font-black text-sm text-white">
                  {cartQty} in cart
                </span>
                <span className="text-[10px] text-dairy-gold font-bold">
                  ₹{currentPrice * cartQty}
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateQuantity(product.id, selectedSize, cartQty + 1)}
                className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg bg-dairy-green-dark hover:bg-dairy-gold hover:text-dairy-green-dark flex items-center justify-center text-xl font-black transition-all active:scale-90"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}

          {/* ── Admin Inline Controls (Only In Stock, Price, Edit) ──────────── */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t-2 border-dashed border-dairy-gold/60 bg-amber-50/70 -mx-5 -mb-5 p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                <span className="flex items-center gap-1 text-dairy-green">
                  <Shield className="w-3.5 h-3.5 text-dairy-gold" /> Admin Controls
                </span>
                <button
                  type="button"
                  onClick={() => setEditingProduct(product)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-dairy-green hover:bg-dairy-green-dark text-white transition-all flex items-center gap-1.5 shadow-sm font-bold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Editable Price */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-stone-600 whitespace-nowrap">Price (₹):</span>
                <input
                  type="number"
                  min={0}
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-24 px-2 py-1.5 rounded-lg border border-dairy-border bg-white text-xs font-bold text-dairy-green focus:outline-none focus:ring-1 focus:ring-dairy-green"
                />
                <button
                  type="button"
                  disabled={savingPrice || editPrice === product.price_primary}
                  onClick={handleSavePrice}
                  className="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-40 transition-colors"
                >
                  {savingPrice ? 'Saving…' : priceSaved ? 'Saved! ✓' : 'Save'}
                </button>
              </div>

              {/* In Stock / Out of Stock Toggle */}
              <div>
                <button
                  type="button"
                  disabled={togglingStock}
                  onClick={handleToggleStock}
                  className={`w-full min-h-[36px] py-1.5 px-3 rounded-lg border transition-all text-center text-xs font-bold ${
                    inStock
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-stone-200 text-stone-700 border-stone-300 hover:bg-stone-300'
                  }`}
                >
                  {togglingStock ? 'Updating…' : inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </button>
              </div>

              {/* Discontinue / Restore Button */}
              <div>
                <button
                  type="button"
                  disabled={togglingDiscontinue}
                  onClick={handleToggleDiscontinue}
                  className={`w-full min-h-[36px] py-1.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    discontinued
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {togglingDiscontinue ? (
                    'Updating…'
                  ) : discontinued ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restore to Storefront</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Discontinue (Hide from Storefront)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Change Photo (File picker / camera on mobile) */}
              <div>
                <label
                  htmlFor={`card-photo-${product.id}`}
                  className="w-full min-h-[36px] py-1.5 px-3 rounded-lg bg-white hover:bg-dairy-cream border border-dairy-border text-xs font-bold text-dairy-green flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading Photo…' : 'Change Photo (Camera/Upload)'}</span>
                </label>
                <input
                  id={`card-photo-${product.id}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
