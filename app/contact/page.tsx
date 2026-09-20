'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { Phone, MapPin, Clock, Send, MessageCircle, CheckCircle2, User, Mail } from 'lucide-react';
import { SHOP_PHONE_DISPLAY, SHOP_PHONE_TEL } from '@/lib/config';

export default function ContactPage() {
  const { language, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Header Banner with Dairy Farm Photo */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-dairy-green-dark">
        <Image
          src="/images/products/farm-hero.jpg"
          alt="Dairy Farm Banner"
          fill
          priority
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dairy-cream via-transparent to-black/40" />

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
          <span className="px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/20 mb-3">
            {t('tagline')}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-dairy-green-dark tracking-tight">
            {t('contact_hero_title')}
          </h1>
          <p className="text-sm sm:text-base text-dairy-muted font-medium mt-2 max-w-xl">
            {t('contact_hero_sub')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-10 border border-dairy-border/80 shadow-dairy space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-dairy-maroon uppercase tracking-wider">
                  {t('proprietor_role')}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dairy-green mt-1">
                  {t('proprietor')}
                </h2>
                <p className="text-xs text-dairy-muted mt-1">
                  {t('brand_name')} • {t('tagline')}
                </p>
              </div>

              <div className="space-y-5 text-sm">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-dairy-green/10 text-dairy-green flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dairy-muted font-semibold">
                      {t('contact_phone_label')}
                    </p>
                    <a
                      href={SHOP_PHONE_TEL}
                      className="text-base font-bold text-dairy-green hover:text-dairy-maroon transition-colors"
                    >
                      {SHOP_PHONE_DISPLAY}
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-dairy-green/10 text-dairy-green flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dairy-muted font-semibold">
                      {t('contact_address_label')}
                    </p>
                    <p className="font-medium text-dairy-text/90 leading-relaxed mt-0.5">
                      {t('full_address_text')}
                    </p>
                  </div>
                </div>

                {/* Timings */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-dairy-green/10 text-dairy-green flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dairy-muted font-semibold">
                      {t('contact_hours_label')}
                    </p>
                    <p className="font-medium text-dairy-text/90 mt-0.5">
                      {t('contact_hours')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp CTA Button */}
            <div className="pt-6 border-t border-dairy-border/50">
              <a
                href="https://wa.me/919815342224?text=Hi%20Kakria%20Dairy%2C%20I%20would%20like%20to%20place%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{language === 'en' ? 'Start WhatsApp Chat' : 'ਵ੍ਹਟਸਐਪ \'ਤੇ ਗੱਲਬਾਤ ਕਰੋ'}</span>
              </a>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-dairy-border/80 shadow-dairy">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-dairy-green">
                  {t('message_sent')}
                </h3>
                <p className="text-sm text-dairy-muted max-w-md mx-auto">
                  {language === 'en'
                    ? `Deepak Kumar Kakria or our team will get in touch with you shortly. You can also call us directly at ${SHOP_PHONE_DISPLAY}.`
                    : `ਦੀਪਕ ਕੁਮਾਰ ਕੱਕੜੀਆ ਜਾਂ ਸਾਡੀ ਟੀਮ ਜਲਦੀ ਹੀ ਤੁਹਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੇਗੀ। ਤੁਸੀਂ ਸਿੱਧਾ ${SHOP_PHONE_DISPLAY} 'ਤੇ ਵੀ ਫ਼ੋਨ ਕਰ ਸਕਦੇ ਹੋ।`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', phone: '', message: '' });
                  }}
                  className="mt-4 px-6 py-2 rounded-xl bg-dairy-cream font-bold text-xs text-dairy-green hover:bg-dairy-cream-dark transition-colors"
                >
                  {language === 'en' ? 'Send Another Inquiry' : 'ਹੋਰ ਸੁਨੇਹਾ ਭੇਜੋ'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-dairy-green">
                    {t('send_message_title')}
                  </h3>
                  <p className="text-xs text-dairy-muted mt-1">
                    {language === 'en'
                      ? 'Have a question or want to order in bulk for an upcoming event? Leave a message below.'
                      : 'ਕੋਈ ਸਵਾਲ ਹੈ ਜਾਂ ਵਿਆਹ/ਸਮਾਗਮ ਲਈ ਥੋਕ ਆਰਡਰ ਦੇਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹੇਠਾਂ ਆਪਣੀ ਜਾਣਕਾਰੀ ਭਰੋ।'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-dairy-text/80 mb-1.5">
                      {t('full_name')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === 'en' ? 'e.g. Jaswinder Singh' : 'ਜਿਵੇਂ: ਜਸਵਿੰਦਰ ਸਿੰਘ'}
                        className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dairy-green text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dairy-text/80 mb-1.5">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 98153XXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dairy-green text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dairy-text/80 mb-1.5">
                      {language === 'en' ? 'Message / Product Requirements' : 'ਸੁਨੇਹਾ / ਲੋੜੀਂਦੇ ਉਤਪਾਦ'}
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={
                        language === 'en'
                          ? 'Specify your requirement (e.g. 20kg paneer for a family wedding)...'
                          : 'ਆਪਣੀ ਲੋੜ ਲਿਖੋ (ਜਿਵੇਂ: ਵਿਆਹ ਲਈ 20 ਕਿੱਲੋ ਪਨੀਰ)...'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dairy-green text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('send_message_btn')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
