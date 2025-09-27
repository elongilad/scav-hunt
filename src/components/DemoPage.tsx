'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HtmlLangUpdater } from "./HtmlLangUpdater";
import { CookieConsent } from "./CookieConsent";

export function DemoPage() {
  const { language } = useLanguage();

  return (
    <>
      <HtmlLangUpdater />
      <Header />

      {/* HERO */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-brand-navy mb-6">
            {language === 'he' ? 'צפה ב-BuildaQuest ' : 'See BuildaQuest '}
            <span className="text-brand-teal">
              {language === 'he' ? 'בפעולה' : 'In Action'}
            </span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-8">
            {language === 'he'
              ? 'צפה כמה קל זה ליצור ציד מטמון מרתק שהצוותים שלך יאהבו.'
              : 'Watch how easy it is to create engaging scavenger hunts that your teams will love.'
            }
          </p>

          <div className="bg-slate-100 rounded-xl2 p-12">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-slate-600">
              {language === 'he' ? 'סרטון הדגמה בקרוב!' : 'Demo video coming soon!'}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {language === 'he'
                ? 'חזור מאוחר יותר או צור קשר לקבלת הדגמה חיה.'
                : 'Check back later or contact us for a live demo.'
              }
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <CookieConsent />
    </>
  );
}