'use client'

import Button from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';

type CTA = { label: string; href: string };

export default function Hero({
  badge,
  title,
  subtitle,
  metrics,
  primaryCta,
  secondaryCta,
  screenshotSrc = "/img/dashboard.svg",
  qrSrc = "/img/qr.svg",
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  metrics?: string;
  primaryCta?: CTA;
  secondaryCta?: CTA;
  screenshotSrc?: string;
  qrSrc?: string;
}) {
  const { language } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-brand-sky">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
        <div>
          {badge ? (
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm shadow-card">
              {badge}
            </span>
          ) : null}
          <h1 className={`mt-5 text-4xl font-semibold leading-tight md:text-5xl text-brand-navy font-display ${language === 'he' ? 'font-hebrew' : ''}`}>
            {title}
          </h1>
          {subtitle ? (
            <p className={`mt-4 max-w-[58ch] text-slate-700 ${language === 'he' ? 'font-hebrew' : ''}`}>
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primaryCta ? <Button href={primaryCta.href}>{primaryCta.label}</Button> : null}
            {secondaryCta ? (
              <Button variant="secondary" href={secondaryCta.href}>
                {secondaryCta.label}
              </Button>
            ) : null}
          </div>
          {metrics ? (
            <div className={`mt-6 text-sm text-slate-600 ${language === 'he' ? 'font-hebrew' : ''}`}>
              {metrics}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <div className="card p-3 shadow-hover">
            <img
              className="w-full rounded-xl"
              src={screenshotSrc}
              alt={language === 'he' ? 'ממשק בניית מסלול' : 'Quest building interface'}
            />
          </div>
          <div className="absolute -bottom-5 -left-5 rounded-xl bg-white p-3 shadow-card">
            <img
              className="h-24 w-24 rounded-lg"
              src={qrSrc}
              alt={language === 'he' ? 'קוד QR' : 'QR Code'}
            />
          </div>
        </div>
      </div>
      {/* Decorative dotted path bg */}
      <svg className="pointer-events-none absolute inset-0 opacity-10 text-brand-teal" viewBox="0 0 800 400" aria-hidden="true">
        <path d="M20 300 C 200 250, 180 100, 400 120 S 680 250, 780 140" fill="none" stroke="currentColor" strokeDasharray="4 8" />
      </svg>
    </section>
  );
}
