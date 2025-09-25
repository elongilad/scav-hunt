import { useLanguage } from '@/contexts/LanguageContext'

export { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'

export function useRTL() {
  const { language } = useLanguage()
  return language === 'he'
}