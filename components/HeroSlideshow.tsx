'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

interface Slide {
  id: number;
  titleKey: string;
  subKey: string;
  badgeKey: string;
  btnKey: string;
  href: string;
  bgGradient: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    titleKey: 'slide1_title',
    subKey: 'slide1_subtitle',
    badgeKey: 'slide1_badge',
    btnKey: 'slide1_btn',
    href: '/categories',
    bgGradient: 'from-[#0E341E] via-[#184E2E] to-[#236D42]',
    image: '/images/products/farm-hero.jpg',
  },
  {
    id: 2,
    titleKey: 'slide2_title',
    subKey: 'slide2_subtitle',
    badgeKey: 'slide2_badge',
    btnKey: 'slide2_btn',
    href: '/categories?cat=ghee',
    bgGradient: 'from-[#4D141C] via-[#6B1D27] to-[#8C2937]',
    image: '/images/products/ghee-cow.jpg',
  },
  {
    id: 3,
    titleKey: 'slide3_title',
    subKey: 'slide3_subtitle',
    badgeKey: 'slide3_badge',
    btnKey: 'slide3_btn',
    href: '/categories?cat=ghee',
    bgGradient: 'from-[#664609] via-[#8C610F] to-[#B87F17]',
    image: '/images/products/ghee-a2-binola.jpg',
  },
  {
    id: 4,
    titleKey: 'slide4_title',
    subKey: 'slide4_subtitle',
    badgeKey: 'slide4_badge',
    btnKey: 'slide4_btn',
    href: '/categories',
    bgGradient: 'from-[#113821] via-[#1A5432] to-[#2B824F]',
    image: '/images/products/paneer.jpg',
  },
  {
    id: 5,
    titleKey: 'slide5_title',
    subKey: 'slide5_subtitle',
    badgeKey: 'slide5_badge',
    btnKey: 'slide5_btn',
    href: '/categories?cat=house-special',
    bgGradient: 'from-[#3A1E14] via-[#5C2E20] to-[#7E402D]',
    image: '/images/products/chatti-milk.jpg',
  },
];

export default function HeroSlideshow() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0E341E] text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative h-[480px] sm:h-[540px] lg:h-[580px] w-full">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <Image
                  src={slide.image}
                  alt="Slide background"
                  fill
                  priority={index === 0}
                  className="object-cover object-center transform scale-105 transition-transform duration-[7000ms] ease-out"
                />
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-90 mix-blend-multiply`}
                />
                <div className="absolute inset-0 bg-black/35" />
              </div>

              {/* Content Overlay */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                <div className="max-w-2xl space-y-4 sm:space-y-6">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-dairy-gold text-xs font-bold border border-white/25 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-dairy-gold animate-pulse" />
                    <span>{t(slide.badgeKey)}</span>
                  </div>

                  {/* Title */}
                  <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white drop-shadow-md">
                    {t(slide.titleKey)}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-lg text-white/90 font-medium leading-relaxed max-w-xl drop-shadow">
                    {t(slide.subKey)}
                  </p>

                  {/* CTA Button */}
                  <div className="pt-2">
                    <Link
                      href={slide.href}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-dairy-gold hover:bg-dairy-gold-light text-dairy-green-dark font-extrabold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>{t(slide.btnKey)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Left/Right Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-200 focus:outline-none"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-200 focus:outline-none"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === current ? 'w-8 bg-dairy-gold' : 'w-2.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
