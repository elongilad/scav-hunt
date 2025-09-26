'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { Languages } from 'lucide-react'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
      className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5"
    >
      <Languages className="w-4 h-4 mr-2" />
      {language === 'he' ? 'עברית' : 'English'}
    </Button>
  )
}