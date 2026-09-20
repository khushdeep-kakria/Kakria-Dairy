'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full bg-dairy-cream-dark p-1 border border-dairy-border shadow-inner">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          language === 'en'
            ? 'bg-dairy-green text-dairy-cream shadow-sm'
            : 'text-dairy-text/70 hover:text-dairy-green'
        }`}
        title="Switch to English"
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-dairy-muted/40 text-xs px-0.5">/</span>
      <button
        type="button"
        onClick={() => setLanguage('pa')}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          language === 'pa'
            ? 'bg-dairy-green text-dairy-cream shadow-sm'
            : 'text-dairy-text/70 hover:text-dairy-green'
        }`}
        title="ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲੋ"
        aria-label="Switch to Punjabi"
      >
        ਪੰ
      </button>
    </div>
  );
}
