'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Heart, Award, ArrowRight, CheckCircle2, MapPin, Phone, ExternalLink, Truck } from 'lucide-react';
import { SHOP_PHONE_DISPLAY, SHOP_PHONE_TEL, GOOGLE_MAPS_LINK, DELIVERY_TOWN } from '@/lib/config';

export default function AboutPage() {
  const { language, t } = useLanguage();

  const photoSpotlight = [
    {
      title: language === 'en' ? 'Slow-Churned Ghee' : 'ਹੌਲੀ ਕਾੜ੍ਹਿਆ ਦੇਸੀ ਘਿਓ',
      image: '/images/products/ghee-cow.jpg',
    },
    {
      title: language === 'en' ? 'Fresh Daily Paneer' : 'ਰੋਜ਼ਾਨਾ ਤਾਜ਼ਾ ਪਨੀਰ',
      image: '/images/products/paneer.jpg',
    },
    {
      title: language === 'en' ? 'Handcrafted White Butter' : 'ਹੱਥੀਂ ਤਿਆਰ ਚਿੱਟਾ ਮੱਖਣ',
      image: '/images/products/butter-white.jpg',
    },
    {
      title: language === 'en' ? 'Clay Chatti Milk' : 'ਮਿੱਟੀ ਦੀ ਚਾਟੀ ਦਾ ਦੁੱਧ',
      image: '/images/products/chatti-milk.jpg',
    },
  ];

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Top Hero with Prominent Logo */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto drop-shadow-xl animate-fadeIn">
          <Image
            src="/images/logo.svg"
            alt="Kakria Dairy Emblem"
            fill
            priority
            className="object-contain"
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-dairy-green/10 text-dairy-green text-xs font-bold border border-dairy-green/20">
            <Award className="w-4 h-4 text-dairy-gold" />
            <span>{t('self_made_badge')} • {t('tagline')}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-dairy-green-dark tracking-tight">
            {t('about_hero_title')}
          </h1>

          <p className="text-base sm:text-lg text-dairy-muted font-medium">
            {t('about_hero_sub')}
          </p>
        </div>
      </div>

      {/* Narrative Section 1: Who Are We? */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-dairy-border/80 shadow-dairy grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-dairy-maroon uppercase tracking-wider">
            <Heart className="w-4 h-4" />
            <span>{language === 'en' ? 'Our Heritage' : 'ਸਾਡੀ ਵਿਰਾਸਤ'}</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-dairy-green">
            {t('who_we_are_title')}
          </h2>
          <div className="space-y-3 text-dairy-text/80 text-sm sm:text-base leading-relaxed">
            <p>{t('who_we_are_p1')}</p>
            <p>{t('who_we_are_p2')}</p>
          </div>
        </div>
        <div className="lg:col-span-5 relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg border border-dairy-border">
          <Image
            src="/images/products/farm-hero.jpg"
            alt="Kakria Dairy Tradition"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <p className="text-white text-xs sm:text-sm font-semibold">
              {language === 'en'
                ? 'Deepak Kumar Kakria upholding pure dairy traditions since 2002'
                : 'ਦੀਪਕ ਕੁਮਾਰ ਕੱਕੜੀਆ 2002 ਤੋਂ ਸ਼ੁੱਧ ਦੇਸੀ ਡੇਅਰੀ ਪਰੰਪਰਾ ਨਿਭਾਉਂਦੇ ਹੋਏ'}
            </p>
          </div>
        </div>
      </section>

      {/* Narrative Section 2 & 3: Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mission */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-dairy-border/80 shadow-dairy space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dairy-green">
            {t('our_mission_title')}
          </h2>
          <div className="space-y-3 text-dairy-text/80 text-sm sm:text-base leading-relaxed">
            <p>{t('our_mission_p1')}</p>
            <p>{t('our_mission_p2')}</p>
          </div>
        </div>

        {/* Vision */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-dairy-border/80 shadow-dairy space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dairy-green">
            {t('our_vision_title')}
          </h2>
          <div className="space-y-3 text-dairy-text/80 text-sm sm:text-base leading-relaxed">
            <p>{t('our_vision_p1')}</p>
            <p>{t('our_vision_p2')}</p>
          </div>
        </div>
      </div>

      {/* Product Photos Spotlight */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-dairy-green">
            {language === 'en' ? 'Crafted In-House With Care' : 'ਸਾਡੇ ਹੱਥੀਂ ਤਿਆਰ ਕੀਤੇ ਉਤਪਾਦ'}
          </h3>
          <p className="text-xs sm:text-sm text-dairy-muted">
            {language === 'en'
              ? 'Every product is unadulterated, wholesome, and crafted daily in Kotakpura'
              : 'ਹਰ ਉਤਪਾਦ ਬਿਨਾਂ ਮਿਲਾਵਟ ਅਤੇ ਸ਼ੁੱਧਤਾ ਨਾਲ ਰੋਜ਼ਾਨਾ ਕੋਟਕਪੂਰਾ ਵਿਖੇ ਤਿਆਰ'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {photoSpotlight.map((spot, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl border border-dairy-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-dairy-cream-dark">
                <Image
                  src={spot.image}
                  alt={spot.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 text-center">
                <p className="font-serif text-xs sm:text-sm font-bold text-dairy-green">
                  {spot.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visit Our Dairy & Town Delivery Note */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-dairy-border/80 shadow-dairy grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-dairy-green uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-dairy-gold" />
            <span>{language === 'en' ? 'Our Location' : 'ਸਾਡਾ ਪਤਾ'}</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dairy-green">
            {language === 'en' ? 'Visit Kakria Dairy in Kotakpura' : 'ਕੋਟਕਪੂਰਾ ਵਿਖੇ ਕੱਕੜੀਆ ਡੇਅਰੀ ਆਓ'}
          </h2>
          <p className="text-sm text-dairy-text/80 leading-relaxed">
            {language === 'en'
              ? 'Serving pure dairy goodness since 2002 under the craft of Deepak Kumar Kakria. Drop by our physical shop or reach out directly for daily fresh milk, paneer, and authentic desi ghee.'
              : 'ਦੀਪਕ ਕੁਮਾਰ ਕੱਕੜੀਆ ਵੱਲੋਂ 2002 ਤੋਂ ਸ਼ੁੱਧ ਦੇਸੀ ਉਤਪਾਦ ਤਿਆਰ ਕੀਤੇ ਜਾਂਦੇ ਹਨ। ਰੋਜ਼ਾਨਾ ਤਾਜ਼ੇ ਦੁੱਧ, ਪਨੀਰ ਅਤੇ ਦੇਸੀ ਘਿਓ ਲਈ ਸਾਡੀ ਦੁਕਾਨ ਤੇ ਆਓ ਜਾਂ ਫ਼ੋਨ ਕਰੋ।'}
          </p>

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3 text-sm text-dairy-text">
              <Phone className="w-4 h-4 text-dairy-green" />
              <span className="font-semibold">{language === 'en' ? 'Shop Contact:' : 'ਦੁਕਾਨ ਦਾ ਫ਼ੋਨ:'}</span>
              <a href={SHOP_PHONE_TEL} className="font-bold text-dairy-green hover:underline">
                {SHOP_PHONE_DISPLAY}
              </a>
            </div>

            <div className="flex items-center gap-3 text-sm text-dairy-text">
              <MapPin className="w-4 h-4 text-dairy-green" />
              <span>Kotkapura, Dist. Faridkot, Punjab</span>
            </div>
          </div>

          <div className="pt-3">
            <a
              href={GOOGLE_MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
            >
              <MapPin className="w-4 h-4 text-dairy-gold" />
              <span>{language === 'en' ? 'View on Google Maps' : 'ਗੂਗਲ ਮੈਪਸ ਤੇ ਦੇਖੋ'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Town Delivery Notice Box */}
        <div className="bg-dairy-cream/60 rounded-2xl p-6 sm:p-8 border border-dairy-border/90 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-dairy-green/10 text-dairy-green flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-dairy-green-dark">
            {language === 'en' ? 'Delivery Policy & Town Limits' : 'ਡਿਲੀਵਰੀ ਨਿਯਮ ਅਤੇ ਦਾਇਰਾ'}
          </h3>
          <p className="text-xs sm:text-sm text-dairy-text/85 leading-relaxed">
            {language === 'en'
              ? 'To guarantee absolute freshness without artificial preservatives or chilled supply chains, online delivery is currently available EXCLUSIVELY within Kotkapura town limits.'
              : 'ਬਿਨਾਂ ਕਿਸੇ ਕੈਮੀਕਲ ਜਾਂ ਪ੍ਰਜ਼ਰਵੇਟਿਵ ਤੋਂ ਬਿਲਕੁਲ ਤਾਜ਼ਾ ਡਿਲੀਵਰੀ ਯਕੀਨੀ ਬਣਾਉਣ ਲਈ, ਆਨਲਾਈਨ ਆਰਡਰ ਸਿਰਫ਼ ਕੋਟਕਪੂਰਾ ਸ਼ਹਿਰ ਦੇ ਅੰਦਰ ਹੀ ਡਿਲੀਵਰ ਕੀਤੇ ਜਾਂਦੇ ਹਨ।'}
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>📍 Notice: Delivery exclusively inside Kotkapura town.</span>
          </div>
        </div>
      </section>

      {/* CTA to Catalog */}
      <div className="text-center pt-4">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
        >
          <span>{language === 'en' ? 'Taste Our Pure Dairy Products' : 'ਸਾਡੇ ਸ਼ੁੱਧ ਉਤਪਾਦ ਦੇਖੋ'}</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
