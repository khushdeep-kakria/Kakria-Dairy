'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import BottomBar from './BottomBar';
import { Phone, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';
import { SHOP_PHONE_DISPLAY, SHOP_PHONE_TEL, GOOGLE_MAPS_LINK } from '@/lib/config';

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-[#122A1A] text-dairy-cream border-t border-dairy-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src="/brand/logo.svg"
                  alt="Kakria Dairy Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white tracking-wide">
                  {t('brand_name')}
                </h3>
                <p className="text-xs text-dairy-gold font-semibold">
                  {t('tagline')}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-dairy-cream/80 leading-relaxed">
              {t('trust_motto')}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dairy-green text-xs font-semibold text-dairy-gold border border-dairy-green-light">
              <ShieldCheck className="w-4 h-4 text-dairy-gold" />
              <span>{t('self_made_badge')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-dairy-gold tracking-wide">
              {language === 'en' ? 'Quick Navigation' : 'ਜ਼ਰੂਰੀ ਲਿੰਕ'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-dairy-cream/80 hover:text-dairy-gold transition-colors"
                >
                  {t('nav_home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-dairy-cream/80 hover:text-dairy-gold transition-colors"
                >
                  {t('nav_categories')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-dairy-cream/80 hover:text-dairy-gold transition-colors"
                >
                  {t('nav_about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-dairy-cream/80 hover:text-dairy-gold transition-colors"
                >
                  {t('nav_contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-dairy-cream/80 hover:text-dairy-gold transition-colors"
                >
                  {t('nav_cart')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Categories */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-dairy-gold tracking-wide">
              {language === 'en' ? 'Our Specialties' : 'ਸਾਡੇ ਉਤਪਾਦ'}
            </h4>
            <ul className="space-y-2 text-sm text-dairy-cream/80">
              <li>
                <Link href="/categories?cat=ghee" className="hover:text-dairy-gold transition-colors">
                  {t('cat_ghee')} (Cow, Buffalo, A2 Binola)
                </Link>
              </li>
              <li>
                <Link href="/categories?cat=paneer" className="hover:text-dairy-gold transition-colors">
                  {t('cat_paneer')} &amp; {t('cat_khoya')}
                </Link>
              </li>
              <li>
                <Link href="/categories?cat=butter" className="hover:text-dairy-gold transition-colors">
                  {t('cat_butter')}
                </Link>
              </li>
              <li>
                <Link href="/categories?cat=lassi" className="hover:text-dairy-gold transition-colors">
                  {t('cat_lassi')} &amp; {t('cat_special')}
                </Link>
              </li>
              <li>
                <Link href="/categories?cat=dahi" className="hover:text-dairy-gold transition-colors">
                  {t('cat_dahi')} &amp; {t('cat_milk')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-dairy-gold tracking-wide">
              {language === 'en' ? 'Visit / Contact' : 'ਸੰਪਰਕ ਵੇਰਵੇ'}
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-dairy-cream/80">
              <div>
                <p className="font-bold text-white">{t('proprietor')}</p>
                <p className="text-[11px] text-dairy-gold">{t('proprietor_role')}</p>
              </div>

              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-dairy-cream/80 hover:text-dairy-gold transition-colors group"
              >
                <MapPin className="w-4 h-4 text-dairy-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="leading-snug">{t('full_address_text')}</span>
              </a>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-dairy-gold flex-shrink-0" />
                <a href={SHOP_PHONE_TEL} className="hover:text-dairy-gold transition-colors font-semibold">
                  {SHOP_PHONE_DISPLAY}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-dairy-gold flex-shrink-0" />
                <span>{t('contact_hours')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar included */}
      <BottomBar />
    </footer>
  );
}
