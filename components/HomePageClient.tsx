'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import HeroSlideshow from '@/components/HeroSlideshow';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/ReviewsSection';
import { MotionFadeIn } from '@/components/MotionWrapper';
import { Product } from '@/types/product';
import {
  ShieldCheck,
  Award,
  Sparkles,
  Flame,
  Truck,
  HeartHandshake,
  Clock,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';

interface HomePageClientProps {
  initialProducts: Product[];
}

export default function HomePageClient({ initialProducts }: HomePageClientProps) {
  const { language, t } = useLanguage();
  const { productsRefreshKey, isAdmin } = useAuth();
  const [products, setProducts] = React.useState<Product[]>(initialProducts);

  React.useEffect(() => {
    fetch('/api/products', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn('Could not fetch latest products:', err));
  }, [productsRefreshKey, isAdmin]);

  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 6);

  const trustPoints = [
    {
      icon: ShieldCheck,
      titleKey: 'trust1_title',
      descKey: 'trust1_desc',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      icon: HeartHandshake,
      titleKey: 'trust2_title',
      descKey: 'trust2_desc',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      icon: Sparkles,
      titleKey: 'trust3_title',
      descKey: 'trust3_desc',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      icon: Clock,
      titleKey: 'trust4_title',
      descKey: 'trust4_desc',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const offers = [
    {
      badge: 'Ghee Bulk Offer',
      title: '5% OFF on Ghee (5kg+)',
      title_pa: "ਦੇਸੀ ਘਿਓ 'ਤੇ 5% ਛੋਟ (5 ਕਿੱਲੋ+)",
      desc: 'Automatic 5% instant discount when your cart contains 5kg or more ghee.',
      desc_pa: 'ਜਦੋਂ ਤੁਹਾਡੇ ਕਾਰਟ ਵਿੱਚ 5 ਕਿੱਲੋ ਜਾਂ ਵੱਧ ਘਿਓ ਹੋਵੇਗਾ ਤਾਂ ਆਟੋਮੈਟਿਕ 5% ਛੋਟ ਮਿਲੇਗੀ।',
      href: '/categories?cat=ghee',
      color: 'from-amber-600 to-amber-800',
    },
    {
      badge: 'Festive Combo',
      title: '2kg A2 Binola Combo — ₹2100',
      title_pa: '2 ਕਿੱਲੋ A2 ਬਿਨੌਲਾ ਕੰਬੋ — ₹2100',
      desc: 'Our hand-churned traditional bilona ghee in a celebratory double value pack.',
      desc_pa: 'ਹੱਥੀਂ ਬਿਲੋਇਆ ਸ਼ੁੱਧ ਦੇਸੀ ਘਿਓ ਹੁਣ ਵਿਸ਼ੇਸ਼ ਤਿਉਹਾਰੀ ਪੈਕ ਵਿੱਚ ਉਪਲਬਧ।',
      href: '/categories?cat=ghee',
      color: 'from-rose-700 to-rose-900',
    },
    {
      badge: 'Storewide Savings',
      title: '5% OFF on Orders Above ₹1000',
      title_pa: "₹1000 ਤੋਂ ਵੱਧ ਦੇ ਆਰਡਰ 'ਤੇ 5% ਛੋਟ",
      desc: 'Stock up on paneer, butter, curd, and milk with an immediate 5% discount.',
      desc_pa: 'ਤਾਜ਼ਾ ਪਨੀਰ, ਮੱਖਣ, ਦਹੀਂ ਅਤੇ ਦੁੱਧ ਮੰਗਵਾਓ ਅਤੇ 5% ਦੀ ਤੁਰੰਤ ਬੱਚਤ ਪਾਓ।',
      href: '/categories',
      color: 'from-emerald-700 to-emerald-900',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Slideshow with smooth cross-fade */}
      <HeroSlideshow />

      {/* 2. "Why Trust Us" Section with Scroll Reveal Animation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionFadeIn direction="up">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dairy-border/80 shadow-dairy space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dairy-green/10 text-dairy-green text-xs font-bold border border-dairy-green/20">
                <Award className="w-4 h-4 text-dairy-gold" />
                <span>{t('self_made_badge')}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-dairy-green-dark tracking-tight">
                {t('trust_heading')}
              </h2>
              <p className="text-sm sm:text-base text-dairy-muted leading-relaxed">
                {t('trust_subheading')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustPoints.map((point, idx) => {
                const IconComponent = point.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-dairy-cream/60 border border-dairy-border/60 hover:border-dairy-gold/50 hover:shadow-md transition-all space-y-3"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${point.color}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-dairy-green-dark">
                      {t(point.titleKey)}
                    </h3>
                    <p className="text-xs sm:text-sm text-dairy-muted leading-relaxed">
                      {t(point.descKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </MotionFadeIn>
      </section>

      {/* 3. Bestsellers Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'en' ? 'Most Loved Products' : 'ਸਭ ਤੋਂ ਵੱਧ ਪਸੰਦ ਕੀਤੇ ਉਤਪਾਦ'}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dairy-green-dark">
              {t('bestsellers_title')}
            </h2>
            <p className="text-sm text-dairy-muted max-w-xl">
              {language === 'en'
                ? 'Handcrafted fresh daily in Kotkapura using traditional recipes handed down for generations.'
                : 'ਕੋਟਕਪੂਰਾ ਵਿੱਚ ਪੀੜ੍ਹੀਆਂ ਤੋਂ ਚੱਲੀਆਂ ਆਉਂਦੀਆਂ ਦੇਸੀ ਵਿਧੀਆਂ ਨਾਲ ਰੋਜ਼ਾਨਾ ਤਾਜ਼ਾ ਤਿਆਰ ਕੀਤਾ ਜਾਂਦਾ ਹੈ।'}
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-bold text-dairy-green hover:text-dairy-green-dark group transition-colors self-start sm:self-auto"
          >
            <span>{t('view_all_products')}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Special Offers Banner Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer, idx) => (
            <Link
              key={idx}
              href={offer.href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.color} p-6 sm:p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1`}
            >
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
                  {offer.badge}
                </span>
                <h3 className="font-serif text-xl font-bold leading-snug">
                  {language === 'en' ? offer.title : offer.title_pa}
                </h3>
                <p className="text-xs text-white/85 leading-relaxed">
                  {language === 'en' ? offer.desc : offer.desc_pa}
                </p>
              </div>

              <div className="pt-6 flex items-center gap-2 text-xs font-extrabold text-dairy-gold group-hover:text-white transition-colors">
                <span>{language === 'en' ? 'Claim Deal' : 'ਆਫ਼ਰ ਪ੍ਰਾਪਤ ਕਰੋ'}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Customer Reviews Section */}
      <ReviewsSection />

      {/* 6. "Bulk & Party Orders" Callout Section with Fade In Animation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionFadeIn direction="up">
          <div className="relative overflow-hidden rounded-3xl bg-dairy-green-dark text-white p-8 sm:p-14 shadow-xl border border-dairy-green">
            <div className="absolute inset-0 opacity-15">
              <Image
                src="/images/products/farm-hero.jpg"
                alt="Farm background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dairy-gold/20 text-dairy-gold text-xs font-bold border border-dairy-gold/30">
                <Truck className="w-4 h-4" />
                <span>{language === 'en' ? 'Bulk Supply & Events' : 'ਵਿਆਹ ਅਤੇ ਪ੍ਰੋਗਰਾਮਾਂ ਲਈ ਥੋਕ ਸਪਲਾਈ'}</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold leading-tight text-white">
                {t('bulk_title')}
              </h2>

              <p className="text-sm sm:text-base text-dairy-cream/90 leading-relaxed">
                {t('bulk_desc')}
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-dairy-gold hover:bg-dairy-gold-light text-dairy-green-dark font-extrabold text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t('bulk_btn')}</span>
                </Link>
                <a
                  href="https://wa.me/919815342224?text=Hi%20Kakria%20Dairy%2C%20I%20want%20to%20inquire%20about%20a%20bulk%20dairy%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/25 backdrop-blur-sm transition-colors"
                >
                  <span>WhatsApp Inquiry (+91 98153 42224)</span>
                </a>
              </div>
            </div>
          </div>
        </MotionFadeIn>
      </section>
    </div>
  );
}
