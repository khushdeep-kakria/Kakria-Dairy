'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import translationsData from '@/data/translations.json';

export type Language = 'en' | 'pa';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kakria_dairy_lang') as Language | null;
      if (saved === 'en' || saved === 'pa') {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Could not read language from localStorage', e);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('kakria_dairy_lang', lang);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pa' : 'en');
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = (translationsData as Record<string, Record<string, string>>)[language] || (translationsData as Record<string, Record<string, string>>)['en'];
    let val = dict[key] || (translationsData as Record<string, Record<string, string>>)['en'][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        val = val.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
