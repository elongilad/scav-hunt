export type Language = 'en' | 'he'

export interface Translations {
  [key: string]: string
}

export const translations: Record<Language, Translations> = {
  en: {
    'spy.mission': 'Spy Mission',
    'decode.infiltrate.complete': 'Decode • Infiltrate • Complete',
    'begin.mission': 'Begin Your Mission',
    'scan.qr.instruction': 'Scan the QR code at your station to receive your mission briefing',
    'scan.qr.code': 'Scan QR Code',
    'cancel': 'Cancel',
    'enter.password': 'Enter your team password',
    'password.placeholder': 'Enter password',
    'decode.mission': 'Decode Mission',
    'mission.decoded': 'Mission Decoded!',
    'watch.briefing': 'Watch Briefing',
    'new.station': 'New Station',
    'reset': 'Reset',
    'invalid.password': 'Invalid password. Please try again.',
    'error.occurred': 'An error occurred. Please try again.',
    'invalid.qr.no.station': 'Invalid QR code: No station ID found',
    'invalid.qr.format': 'Invalid QR code format',
    'station.not.found': 'Station not found',
    'failed.load.stations': 'Failed to load station data',
    'mission.video': 'Mission Video',
    'loading.video': 'Loading video...',
    'scan.next.station': 'Scan Next Station'
  },
  he: {
    'spy.mission': 'משימת מרגל',
    'decode.infiltrate.complete': 'פענח • הסתנן • השלם',
    'begin.mission': 'התחל את המשימה',
    'scan.qr.instruction': 'סרוק את קוד ה-QR בתחנה שלך כדי לקבל את תדרוך המשימה',
    'scan.qr.code': 'סרוק קוד QR',
    'cancel': 'ביטול',
    'enter.password': 'הכנס את סיסמת הצוות שלך',
    'password.placeholder': 'הכנס סיסמה',
    'decode.mission': 'פענח משימה',
    'mission.decoded': 'המשימה פוענחה!',
    'watch.briefing': 'צפה בתדרוך',
    'new.station': 'תחנה חדשה',
    'reset': 'איפוס',
    'invalid.password': 'סיסמה שגויה. אנא נסה שוב.',
    'error.occurred': 'אירעה שגיאה. אנא נסה שוב.',
    'invalid.qr.no.station': 'קוד QR לא תקין: לא נמצא מזהה תחנה',
    'invalid.qr.format': 'פורמט קוד QR לא תקין',
    'station.not.found': 'התחנה לא נמצאה',
    'failed.load.stations': 'טעינת נתוני התחנה נכשלה',
    'mission.video': 'וידאו המשימה',
    'loading.video': 'טוען וידאו...',
    'scan.next.station': 'סרוק תחנה הבאה'
  }
}

export function useTranslation(language: Language = 'en') {
  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key
  }

  return { t, isRTL: language === 'he' }
}