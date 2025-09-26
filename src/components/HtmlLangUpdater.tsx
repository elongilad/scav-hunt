'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export function HtmlLangUpdater() {
  const { language } = useLanguage()

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language

    // Update HTML dir attribute for RTL languages
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr'
  }, [language])

  return null
}