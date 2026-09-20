'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';
import { ShieldCheck, Award } from 'lucide-react';

const categoryList = [
  { id: 'all', labelKey: 'cat_all' },
  { id: 'ghee', labelKey: 'cat_ghee' },
  { id: 'paneer', labelKey: 'cat_paneer' },
  { id: 'khoya', labelKey: 'cat_khoya' },
  { id: 'milk', labelKey: 'cat_milk' },
  { id: 'dahi', labelKey: 'cat_dahi' },
  { id: 'lassi', labelKey: 'cat_lassi' },
  { id: 'house-special', labelKey: 'cat_special' },
  { id: 'white-butter', labelKey: 'cat_butter' },
];

interface CategoriesClientProps {
  initialProducts: Product[];
}

function CategoriesContent({ initialProducts }: CategoriesClientProps) {
  const { language, t } = useLanguage();
  const { productsRefreshKey, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);

  useEffect(() => {
    fetch('/api/products', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn('Could not fetch latest products:', err));
  }, [productsRefreshKey, isAdmin]);

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat && categoryList.some((c) => c.id === cat)) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dairy-green/10 text-dairy-green text-xs font-bold border border-dairy-green/20">
          <Award className="w-4 h-4 text-dairy-gold" />
          <span>
            {t('self_made_badge')} — {t('tagline')}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-dairy-green-dark tracking-tight">
          {language === 'en' ? 'Our Fresh Dairy Catalog' : 'ਸਾਡੇ ਤਾਜ਼ੇ ਡੇਅਰੀ ਉਤਪਾਦ'}
        </h1>
        <p className="text-sm sm:text-base text-dairy-muted leading-relaxed">
          {language === 'en'
            ? 'Handmade in Kotakpura every morning using traditional methods. No chemicals, no powders — guaranteed 100% purity in every bite.'
            : 'ਹਰ ਰੋਜ਼ ਸਵੇਰੇ ਰਵਾਇਤੀ ਤਰੀਕਿਆਂ ਨਾਲ ਕੋਟਕਪੂਰਾ ਵਿਖੇ ਹੱਥੀਂ ਤਿਆਰ। ਬਿਨਾਂ ਮਿਲਾਵਟ, ਬਿਨਾਂ ਪਾਊਡਰ — ਹਰ ਚੀਜ਼ ਵਿੱਚ 100% ਸ਼ੁੱਧਤਾ ਦੀ ਗਾਰੰਟੀ।'}
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 gap-2 scrollbar-none">
        {categoryList.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm ${
                isSelected
                  ? 'bg-dairy-green text-white shadow-md scale-105 ring-2 ring-dairy-gold/50'
                  : 'bg-white text-dairy-text/80 hover:bg-dairy-cream-dark hover:text-dairy-green border border-dairy-border'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Trust Notice Banner */}
      <div className="bg-dairy-gold/10 border border-dairy-gold/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-dairy-green text-xs font-semibold">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <ShieldCheck className="w-5 h-5 text-dairy-gold flex-shrink-0" />
          <span>
            {language === 'en'
              ? "✨ 5% Automatic Discount on 5kg+ Ghee | 5% Instant Off on all orders above ₹1000 | FREE Delivery over ₹300!"
              : "✨ 5 ਕਿੱਲੋ+ ਘਿਓ 'ਤੇ 5% ਛੋਟ | ₹1000+ ਦੇ ਆਰਡਰ 'ਤੇ 5% ਛੋਟ | ₹300 ਤੋਂ ਵੱਧ ਦੇ ਆਰਡਰ 'ਤੇ ਮੁਫ਼ਤ ਡਿਲੀਵਰੀ!"}
          </span>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dairy-border">
          <p className="text-dairy-muted text-sm font-medium">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesClient({ initialProducts }: CategoriesClientProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-dairy-green font-bold">Loading Dairy Catalog...</div>
      }
    >
      <CategoriesContent initialProducts={initialProducts} />
    </Suspense>
  );
}
