'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage, useRTL } from '@/components/LanguageProvider'
import { locales } from '@/lib/i18n'
import { 
  Languages,
  Check,
  ChevronDown,
  Globe
} from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'button' | 'dropdown' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  showFlag?: boolean
  showText?: boolean
}

export default function LanguageSwitcher({ 
  variant = 'button',
  size = 'md',
  showFlag = true,
  showText = true
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLanguage()
  const { isRTL, rtlClass } = useRTL()
  const [isOpen, setIsOpen] = useState(false)

  const currentLocale = locales.find(l => l.code === locale) || locales[0]

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        {locales.map((localeOption) => (
          <button
            key={localeOption.code}
            onClick={() => setLocale(localeOption.code)}
            className={`
              px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
              ${locale === localeOption.code 
                ? 'bg-spy-gold text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            {showFlag && (
              <span className={rtlClass('mr-1', 'ml-1')}>{localeOption.flag}</span>
            )}
            {showText && localeOption.name}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size={size === 'md' ? 'default' : size}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            bg-white/10 border-white/20 text-white hover:bg-white/20
            ${isRTL ? 'flex-row-reverse' : 'flex-row'}
          `}
        >
          {showFlag && <span className={rtlClass('mr-2', 'ml-2')}>{currentLocale.flag}</span>}
          {showText && <span>{currentLocale.name}</span>}
          <ChevronDown className={`w-4 h-4 ${rtlClass('ml-2', 'mr-2')} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <Card className={`
              absolute top-full mt-2 z-50 min-w-[160px]
              bg-white/10 backdrop-blur-md border-white/20
              ${isRTL ? 'right-0' : 'left-0'}
            `}>
              <CardContent className="p-2">
                {locales.map((localeOption) => (
                  <button
                    key={localeOption.code}
                    onClick={() => {
                      setLocale(localeOption.code)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      flex items-center justify-between
                      ${locale === localeOption.code 
                        ? 'bg-spy-gold text-black' 
                        : 'text-white hover:bg-white/20'
                      }
                      ${isRTL ? 'flex-row-reverse' : 'flex-row'}
                    `}
                  >
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                      {showFlag && (
                        <span className={rtlClass('mr-2', 'ml-2')}>{localeOption.flag}</span>
                      )}
                      {showText && localeOption.name}
                    </div>
                    {locale === localeOption.code && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  // Default button variant
  return (
    <Button
      variant="outline"
      size={size === 'md' ? 'default' : size}
      onClick={() => {
        const currentIndex = locales.findIndex(l => l.code === locale)
        const nextIndex = (currentIndex + 1) % locales.length
        setLocale(locales[nextIndex].code)
      }}
      className={`
        bg-white/10 border-white/20 text-white hover:bg-white/20
        ${isRTL ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {showFlag ? (
        <span className={rtlClass('mr-2', 'ml-2')}>{currentLocale.flag}</span>
      ) : (
        <Languages className={`w-4 h-4 ${rtlClass('mr-2', 'ml-2')}`} />
      )}
      {showText && currentLocale.name}
    </Button>
  )
}

// Floating language switcher for mobile
export function FloatingLanguageSwitcher() {
  const { isRTL } = useRTL()
  
  return (
    <div className={`
      fixed bottom-4 z-50 md:hidden
      ${isRTL ? 'left-4' : 'right-4'}
    `}>
      <LanguageSwitcher 
        variant="button" 
        size="sm" 
        showText={false}
        showFlag={true}
      />
    </div>
  )
}

// Language selector for settings page
export function LanguageSettings() {
  const { locale, setLocale, t } = useLanguage()
  const { isRTL } = useRTL()

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              <Globe className={`w-5 h-5 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('common.language')}
            </h3>
            <p className="text-gray-400 text-sm">
              {t('settings.chooseLanguage')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {locales.map((localeOption) => (
              <button
                key={localeOption.code}
                onClick={() => setLocale(localeOption.code)}
                className={`
                  p-4 rounded-lg border transition-all duration-200
                  flex items-center justify-between
                  ${locale === localeOption.code 
                    ? 'bg-spy-gold/20 border-spy-gold/50 text-spy-gold' 
                    : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                  }
                  ${isRTL ? 'flex-row-reverse' : 'flex-row'}
                `}
              >
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className={`text-2xl ${isRTL ? 'ml-3' : 'mr-3'}`}>
                    {localeOption.flag}
                  </span>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="font-medium">{localeOption.name}</p>
                    <p className="text-sm opacity-75">
                      {localeOption.code === 'he' ? 'Hebrew' : 'English'}
                    </p>
                  </div>
                </div>
                
                {locale === localeOption.code && (
                  <div className="flex items-center">
                    <Badge className="bg-spy-gold text-black">
                      {t('common.active')}
                    </Badge>
                    <Check className={`w-5 h-5 text-spy-gold ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-white/20 pt-4">
            <p className="text-xs text-gray-400">
              {t('settings.languageNote')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}