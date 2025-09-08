'use client'

import { Language } from '@/lib/i18n'
import { Globe } from 'lucide-react'

interface LanguageToggleProps {
  currentLanguage: Language
  onLanguageChange: (lang: Language) => void
}

export default function LanguageToggle({ currentLanguage, onLanguageChange }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onLanguageChange(currentLanguage === 'en' ? 'he' : 'en')}
      className="fixed top-4 right-4 z-40 bg-white/10 backdrop-blur-lg border border-white/20 text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
      title="Toggle Language"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">
          {currentLanguage === 'en' ? 'עב' : 'EN'}
        </span>
      </div>
    </button>
  )
}