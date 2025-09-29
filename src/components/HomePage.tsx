'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HtmlLangUpdater } from "./HtmlLangUpdater";
import { CookieConsent } from "./CookieConsent";
import { SkipLink } from "./SkipLink";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import Hero from "./sections/Hero";
import QuestTemplates from "./sections/QuestTemplates";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import Pricing from "./sections/Pricing";

export function HomePage() {
  const { language } = useLanguage();

  return (
    <>
      <HtmlLangUpdater />
      <ServiceWorkerRegistration />
      <SkipLink />
      <Header />

      <main id="main-content">
        <Hero
          badge={language === 'he' ? '🎉 חדש: הזמנה מהירה בקליק אחד' : '🎉 New: One-click instant purchase'}
          title={language === 'he' ? 'הרפתקאות ציד מטמון מקצועיות' : 'Professional Scavenger Hunt Adventures'}
          subtitle={language === 'he'
            ? 'קנו, התאימו ושחקו תוך 15 דקות. תבניות מקצועיות עם סיפורים מרתקים, אתגרים מאוזנים ומעקב חי.'
            : 'Buy, customize, and play in 15 minutes. Professional templates with engaging storylines, balanced challenges, and live tracking.'
          }
          primaryCta={{
            label: language === 'he' ? 'עיינו בקטלוג' : 'Browse Catalog',
            href: '/catalog'
          }}
          secondaryCta={{
            label: language === 'he' ? 'צפו בדגמה' : 'See Demo',
            href: '/demo'
          }}
          metrics={language === 'he'
            ? '⭐ 4.9/5 דירוג · 🎯 500+ אירועים מוצלחים · ⚡ הקמה תוך 15 דקות'
            : '⭐ 4.9/5 rating · 🎯 500+ successful events · ⚡ 15-minute setup'
          }
          screenshotSrc="/img/quest-marketplace.svg"
          qrSrc="/img/mobile-scanning.svg"
        />

        <QuestTemplates />
        <HowItWorks />
        <Features />
        <Pricing />

        {/* FINAL CTA */}
        <section className="py-16 bg-brand-navy text-white text-center">
          <h3 className={`font-display text-3xl md:text-4xl ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he' ? 'מוכנים להתחיל?' : 'Ready to Get Started?'}
          </h3>
          <p className={`mt-4 text-lg text-brand-sky/90 max-w-2xl mx-auto ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he'
              ? 'בחרו תבנית, התאימו לאירוע שלכם והתחילו לשחק תוך דקות ספורות'
              : 'Choose a template, customize for your event, and start playing in minutes'
            }
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/catalog"
              className={`inline-flex items-center rounded-lg bg-brand-gold text-brand-navy px-8 py-4 text-lg font-semibold hover:opacity-90 transition-opacity ${language === 'he' ? 'font-hebrew' : ''}`}
            >
              {language === 'he' ? 'התחילו עכשיו' : 'Start Now'}
            </a>
            <a
              href="/demo"
              className={`inline-flex items-center rounded-lg border-2 border-white text-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-brand-navy transition-colors ${language === 'he' ? 'font-hebrew' : ''}`}
            >
              {language === 'he' ? 'צפו בדגמה' : 'Watch Demo'}
            </a>
          </div>
        </section>
      </main>

      <Footer />
      <CookieConsent />
    </>
  );
}