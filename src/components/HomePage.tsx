'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from "./Header";
import { Footer } from "./Footer";

export function HomePage() {
  const { language } = useLanguage();

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-white to-brand-sky">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-brand-navy leading-tight">
              {language === 'he' ? 'המסיבה שלך, החידה שלך.' : 'Your party, your '}<span className="text-brand-teal">{language === 'he' ? '' : 'quest'}</span>{language === 'he' ? '' : '.'}
            </h1>
            <p className="mt-4 text-lg text-slate-700 max-w-prose">
              {language === 'he'
                ? 'BuildaQuest מאפשר לך ליצור הרפתקאות ציד מטמון מותאמות אישית עם תחנות, משימות ומעקב חי של צוותים - בדקות.'
                : 'BuildaQuest lets you create personalized scavenger hunt adventures with stations, missions, and live team tracking — in minutes.'
              }
            </p>
            <div className="mt-8 flex gap-3">
              <a href="/auth/signup" className="rounded-lg bg-brand-navy text-white px-5 py-3 hover:opacity-90">
                {language === 'he' ? 'התחל לבנות' : 'Start Building'}
              </a>
              <a href="/demo" className="rounded-lg border border-brand-navy text-brand-navy px-5 py-3 hover:bg-brand-navy/5">
                {language === 'he' ? 'צפה בדגמה' : 'See Demo'}
              </a>
            </div>
            <div className="mt-6 flex gap-6 text-sm text-slate-600">
              <div>{language === 'he' ? '🎉 5+ צוותים לאירוע' : '🎉 5+ teams per event'}</div>
              <div>{language === 'he' ? '🧩 10-20 תחנות' : '🧩 10–20 stations'}</div>
              <div>{language === 'he' ? '⚡ ניווט חכם' : '⚡ Smart routing'}</div>
            </div>
          </div>
          <div className="relative">
            <div className="w-full aspect-video bg-gradient-to-br from-brand-sky to-brand-teal/20 rounded-xl2 shadow-card flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-brand-navy font-medium">
                  {language === 'he' ? 'בונה חידות אינטראקטיבי' : 'Interactive Quest Builder'}
                </p>
                <p className="text-slate-600 text-sm mt-1">
                  {language === 'he' ? 'חזותי בקרוב' : 'Visual coming soon'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <Footer />
    </>
  );
}