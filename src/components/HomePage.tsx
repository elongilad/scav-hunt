'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from "./Header";
import { Footer } from "./Footer";
import { HtmlLangUpdater } from "./HtmlLangUpdater";
import { CookieConsent } from "./CookieConsent";
import { SkipLink } from "./SkipLink";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import Hero from "./sections/Hero";

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
          title={language === 'he' ? 'המסיבה שלך, החידה שלך.' : 'Your party, your quest.'}
          subtitle={language === 'he'
            ? 'BuildaQuest מאפשר לך ליצור הרפתקאות ציד מטמון מותאמות אישית עם תחנות, משימות ומעקב חי של צוותים - בדקות.'
            : 'BuildaQuest lets you create personalized scavenger hunt adventures with stations, missions, and live team tracking — in minutes.'
          }
          primaryCta={{
            label: language === 'he' ? 'התחל לבנות' : 'Start Building',
            href: '/auth/signup'
          }}
          secondaryCta={{
            label: language === 'he' ? 'צפה בדגמה' : 'See Demo',
            href: '/demo'
          }}
          metrics={language === 'he'
            ? '🎉 5+ צוותים לאירוע · 🧩 10-20 תחנות · ⚡ ניווט חכם'
            : '🎉 5+ teams per event · 🧩 10–20 stations · ⚡ Smart routing'
          }
          screenshotSrc="/img/dashboard.png"
          qrSrc="/img/qr.png"
        />

      {/* HOW IT WORKS */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl text-brand-navy text-center">
            {language === 'he' ? 'איך זה עובד' : 'How it works'}
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: language === 'he' ? 'בחר נושא' : 'Pick a theme',
                desc: language === 'he' ? 'מרגל, פיראט (עוד בקרוב)' : 'Spy, Pirate (more soon)',
                icon: "🧭"
              },
              {
                title: language === 'he' ? 'בחר תחנות' : 'Select stations',
                desc: language === 'he' ? 'הצעה אוטומטית במרחק 1.6 ק"מ' : 'Auto-suggest within 1 mile',
                icon: "📍"
              },
              {
                title: language === 'he' ? 'הקצה משימות' : 'Assign missions',
                desc: language === 'he' ? 'איזון מסלולים וזמנים' : 'Balance routes & timing',
                icon: "🧩"
              },
              {
                title: language === 'he' ? 'שחק ועקוב' : 'Play & track',
                desc: language === 'he' ? 'סריקת QR והתקדמות חיה' : 'QR scans & live progress',
                icon: "🏁"
              },
            ].map((i) => (
              <div key={i.title} className="rounded-xl2 bg-white shadow-card p-6">
                <div className="text-3xl">{i.icon}</div>
                <h3 className="mt-3 font-display text-xl text-brand-navy">{i.title}</h3>
                <p className="mt-1 text-slate-600">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 bg-brand-navy text-white text-center">
        <h3 className="font-display text-3xl">
          {language === 'he' ? 'מוכן לבנות את החידה הראשונה שלך?' : 'Ready to build your first quest?'}
        </h3>
        <p className="mt-2 text-brand-sky/90">
          {language === 'he' ? 'צור אירוע, בחר תחנות, הקצה משימות - קדימה!' : 'Create an event, pick stations, assign missions—go!'}
        </p>
        <a href="/auth/signup" className="mt-6 inline-flex rounded-lg bg-brand-gold text-brand-navy px-6 py-3 hover:opacity-90">
          {language === 'he' ? 'התחל לבנות' : 'Start Building'}
        </a>
      </section>
      </main>

      <Footer />
      <CookieConsent />
    </>
  );
}