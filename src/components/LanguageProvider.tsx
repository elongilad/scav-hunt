'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { defaultLocale, type Locale, getLocaleFromCode } from '@/lib/i18n'
import { t } from '@/lib/i18n/translations'

interface LanguageContextType {
  locale: string
  direction: 'ltr' | 'rtl'
  setLocale: (locale: string) => void
  t: (key: string) => string
  formatDate: (date: Date | string) => string
  formatTime: (date: Date | string) => string
  formatDateTime: (date: Date | string) => string
  formatNumber: (number: number) => string
  formatCurrency: (amount: number, currency?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(defaultLocale)
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem('locale') || defaultLocale
    setLocaleState(savedLocale)
    
    const localeData = getLocaleFromCode(savedLocale)
    setDirection(localeData.dir)
    
    // Update document direction and lang
    document.documentElement.dir = localeData.dir
    document.documentElement.lang = localeData.code
  }, [])

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    
    const localeData = getLocaleFromCode(newLocale)
    setDirection(localeData.dir)
    
    // Update document direction and lang
    document.documentElement.dir = localeData.dir
    document.documentElement.lang = localeData.code
  }

  const translate = (key: string) => t(key, locale)

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (date: Date | string) => {
    return `${formatDate(date)} ${formatTime(date)}`
  }

  const formatNumber = (number: number) => {
    return number.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US')
  }

  const formatCurrency = (amount: number, currency: string = 'ILS') => {
    return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const value: LanguageContextType = {
    locale,
    direction,
    setLocale,
    t: translate,
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatCurrency
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook for RTL-aware classes
export function useRTL() {
  const { direction } = useLanguage()
  
  const rtlClass = (ltrClass: string, rtlClass?: string) => {
    if (direction === 'rtl') {
      return rtlClass || ltrClass.replace(/left/g, 'RIGHT').replace(/right/g, 'left').replace(/RIGHT/g, 'right')
    }
    return ltrClass
  }

  const marginClass = (side: 'left' | 'right', size: string) => {
    if (direction === 'rtl') {
      const oppositeSide = side === 'left' ? 'right' : 'left'
      return `m${oppositeSide[0]}-${size}`
    }
    return `m${side[0]}-${size}`
  }

  const paddingClass = (side: 'left' | 'right', size: string) => {
    if (direction === 'rtl') {
      const oppositeSide = side === 'left' ? 'right' : 'left'
      return `p${oppositeSide[0]}-${size}`
    }
    return `p${side[0]}-${size}`
  }

  return {
    direction,
    isRTL: direction === 'rtl',
    rtlClass,
    marginClass,
    paddingClass,
    // Common RTL-aware classes
    ml: (size: string) => marginClass('left', size),
    mr: (size: string) => marginClass('right', size),
    pl: (size: string) => paddingClass('left', size),
    pr: (size: string) => paddingClass('right', size),
    textAlign: direction === 'rtl' ? 'text-right' : 'text-left'
  }
}