'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function SkipLink() {
  const { language } = useLanguage()

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
    >
      {language === 'he' ? 'דלג לתוכן הראשי' : 'Skip to main content'}
    </a>
  )
}