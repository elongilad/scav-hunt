export interface Locale {
  code: string
  name: string
  dir: 'ltr' | 'rtl'
  flag: string
}

export const locales: Locale[] = [
  {
    code: 'he',
    name: 'עברית',
    dir: 'rtl',
    flag: '🇮🇱'
  },
  {
    code: 'en',
    name: 'English',
    dir: 'ltr',
    flag: '🇺🇸'
  }
]

export const defaultLocale = 'he'

export function getLocaleFromCode(code: string): Locale {
  return locales.find(locale => locale.code === code) || locales[0]
}

export function getOppositeDirection(dir: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  return dir === 'ltr' ? 'rtl' : 'ltr'
}

// Date and time formatting for Hebrew
export function formatDate(date: Date | string, locale: string = 'he'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (locale === 'he') {
    return dateObj.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(date: Date | string, locale: string = 'he'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (locale === 'he') {
    return dateObj.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(date: Date | string, locale: string = 'he'): string {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`
}

// Number formatting for Hebrew
export function formatNumber(number: number, locale: string = 'he'): string {
  if (locale === 'he') {
    return number.toLocaleString('he-IL')
  }
  return number.toLocaleString('en-US')
}

// Currency formatting for Hebrew (ILS)
export function formatCurrency(amount: number, currency: string = 'ILS', locale: string = 'he'): string {
  if (locale === 'he') {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Hebrew pluralization rules
export function getHebrewPlural(count: number, singular: string, plural: string, pluralSpecial?: string): string {
  if (count === 1) return singular
  if (count === 2 && pluralSpecial) return pluralSpecial
  return plural
}

// Direction-aware icon rotation
export function getIconRotation(icon: string, direction: 'ltr' | 'rtl'): string {
  const directionalIcons = ['ArrowLeft', 'ArrowRight', 'ChevronLeft', 'ChevronRight']
  
  if (direction === 'rtl' && directionalIcons.some(dirIcon => icon.includes(dirIcon))) {
    if (icon.includes('Left')) {
      return icon.replace('Left', 'Right')
    }
    if (icon.includes('Right')) {
      return icon.replace('Right', 'Left')
    }
  }
  
  return icon
}

// RTL-aware margin/padding classes
export function getSpacingClass(spacing: string, direction: 'ltr' | 'rtl'): string {
  if (direction === 'rtl') {
    return spacing
      .replace(/ml-/g, 'mr-')
      .replace(/mr-/g, 'ml-')
      .replace(/pl-/g, 'pr-')
      .replace(/pr-/g, 'pl-')
      .replace(/left-/g, 'right-')
      .replace(/right-/g, 'left-')
  }
  return spacing
}