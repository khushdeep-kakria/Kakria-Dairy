'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Phone, MapPin, Sparkles } from 'lucide-react';
import { SHOP_PHONE_DISPLAY, SHOP_PHONE_TEL, GOOGLE_MAPS_LINK } from '@/lib/config';

export default function TopBar() {
  const { language, t } = useLanguage();

  return (
    <div className="bg-dairy-green-dark text-dairy-cream text-xs py-2 px-4 border-b border-dairy-green">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-dairy-gold animate-pulse" />
          <span>{t('top_bar')}</span>
        </div>
        <div className="flex items-center gap-4 text-dairy-cream/90">
          <a
            href={SHOP_PHONE_TEL}
            className="flex items-center gap-1.5 hover:text-dairy-gold transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-dairy-gold" />
            <span>{SHOP_PHONE_DISPLAY}</span>
          </a>
          <span className="hidden md:inline text-dairy-cream/40">•</span>
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-dairy-cream/80 hover:text-dairy-gold transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-dairy-gold" />
            <span>Kotakpura, Dist-Faridkot</span>
          </a>
        </div>
      </div>
    </div>
  );
}
