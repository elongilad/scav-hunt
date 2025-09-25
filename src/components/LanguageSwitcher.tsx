'use client'

import { useLanguage } from '@/components/LanguageProvider'
import { Switch } from '@/components/ui/switch'
import { Languages } from 'lucide-react'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (checked: boolean) => {
    setLanguage(checked ? 'en' : 'he')
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">עב</span>
      <Switch
        checked={language === 'en'}
        onCheckedChange={handleLanguageChange}
      />
      <span className="text-sm text-gray-400">EN</span>
    </div>
  )
}