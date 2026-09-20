'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function BottomBar() {
  const { t } = useLanguage();

  return (
    <div className="bg-dairy-green-dark text-dairy-cream text-xs py-3 px-4 text-center border-t border-dairy-green">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-medium text-dairy-cream/90">
          {t('bottom_bar')}
        </p>
        <div className="flex items-center gap-2 text-dairy-cream/60 text-[11px]">
          <span>© {new Date().getFullYear()} Kakria Dairy. All rights reserved.</span>
          <span>•</span>
          <Link href="/login" className="hover:text-dairy-gold transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
