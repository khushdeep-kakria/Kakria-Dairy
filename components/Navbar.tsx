'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LanguageToggle from './LanguageToggle';
import { ShoppingBag, Menu, X, Shield } from 'lucide-react';

export default function Navbar() {
  const { language, t } = useLanguage();
  const { totalItems, lastAddedTime } = useCart();
  const { isAdmin, adminUsername, logoutAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', labelKey: 'nav_home' },
    { href: '/categories', labelKey: 'nav_categories' },
    { href: '/#reviews', labelKey: 'nav_reviews' },
    { href: '/about', labelKey: 'nav_about' },
    { href: '/contact', labelKey: 'nav_contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-30 bg-dairy-cream/95 backdrop-blur-md border-b border-dairy-border/80 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/brand/logo.svg"
                alt="Kakria Dairy Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-dairy-green group-hover:text-dairy-green-dark transition-colors">
                  {t('brand_name')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-dairy-maroon">
                <span className="bg-dairy-maroon/10 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                  {t('tagline')}
                </span>
                <span className="hidden sm:inline text-dairy-muted/70">•</span>
                <span className="hidden sm:inline text-dairy-muted">Kotakpura</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 ${
                    active
                      ? 'text-dairy-green bg-dairy-green/10 font-bold'
                      : 'text-dairy-text/80 hover:text-dairy-green hover:bg-dairy-cream-dark'
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Language Toggle, Cart, Admin */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 rounded-full text-dairy-green hover:bg-dairy-cream-dark transition-colors"
              aria-label={t('nav_cart')}
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span
                  key={lastAddedTime}
                  className="absolute -top-1 -right-1 bg-dairy-maroon text-dairy-cream text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce"
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Small discrete Admin link */}
            <div className="hidden sm:block">
              {isAdmin ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  Admin
                </span>
              ) : (
                <Link
                  href="/login"
                  className="text-xs text-dairy-muted/70 hover:text-dairy-green transition-colors px-2 py-1"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-dairy-text hover:bg-dairy-cream-dark transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dairy-border bg-dairy-cream px-4 pt-3 pb-5 space-y-2 shadow-lg animate-fadeIn">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-base font-semibold ${
                  active
                    ? 'text-dairy-green bg-dairy-green/10 font-bold'
                    : 'text-dairy-text/90 hover:bg-dairy-cream-dark'
                }`}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-dairy-border flex items-center justify-between">
            {isAdmin ? (
              <div className="flex items-center justify-between w-full text-xs">
                <span className="font-bold text-dairy-green">Admin Mode (@{adminUsername})</span>
                <button
                  onClick={() => {
                    logoutAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-semibold px-2 py-1 bg-red-50 rounded"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="w-full text-center">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-dairy-muted hover:text-dairy-green transition-colors"
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
