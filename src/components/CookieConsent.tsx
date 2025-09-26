'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const { language } = useLanguage()

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
  }

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              {language === 'he'
                ? 'אנחנו משתמשים בעוגיות כדי לשפר את החוויה שלך. העוגיות עוזרות לנו להבין איך אתה משתמש באתר ולשפר אותו.'
                : 'We use cookies to enhance your experience. These cookies help us understand how you use our site and improve it.'
              }
              {' '}
              <a
                href="/privacy"
                className="text-brand-navy hover:text-brand-teal underline"
              >
                {language === 'he' ? 'מדיניות הפרטיות' : 'Privacy Policy'}
              </a>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {language === 'he' ? 'דחה' : 'Decline'}
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 text-sm bg-brand-navy text-white rounded-md hover:bg-brand-navy/90 transition-colors"
            >
              {language === 'he' ? 'אקבל עוגיות' : 'Accept Cookies'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}