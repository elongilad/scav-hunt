import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Client-side Stripe promise
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// Pricing configuration
export const PRICING_PLANS = {
  FREE: {
    id: 'free',
    name: 'תכנית בחינם',
    price: 0,
    currency: 'ILS',
    features: [
      'עד 2 אירועים בחודש',
      'עד 20 משתתפים לאירוע',
      'תמיכה בסיסית',
      'תבניות ציד בסיסיות'
    ],
    limits: {
      events_per_month: 2,
      participants_per_event: 20,
      video_storage_gb: 1,
      custom_templates: false
    }
  },
  BASIC: {
    id: 'basic',
    name: 'תכנית בסיסית',
    price: 99,
    currency: 'ILS',
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      'עד 10 אירועים בחודש',
      'עד 100 משתתפים לאירוע',
      'תמיכה מלאה',
      'כל תבניות הציד',
      'ייצוא PDF ו-QR',
      'אחסון וידאו 10GB'
    ],
    limits: {
      events_per_month: 10,
      participants_per_event: 100,
      video_storage_gb: 10,
      custom_templates: true
    }
  },
  PRO: {
    id: 'pro',
    name: 'תכנית מקצועית',
    price: 199,
    currency: 'ILS',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'אירועים ללא הגבלה',
      'עד 500 משתתפים לאירוע',
      'תמיכה עדיפות',
      'תבניות מותאמות אישית',
      'ברנדינג מותאם',
      'אחסון וידאו 50GB',
      'אנליטיקס מתקדם'
    ],
    limits: {
      events_per_month: -1, // unlimited
      participants_per_event: 500,
      video_storage_gb: 50,
      custom_templates: true,
      custom_branding: true,
      advanced_analytics: true
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'תכנית ארגונית',
    price: 499,
    currency: 'ILS',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'כל התכונות של התכנית המקצועית',
      'משתתפים ללא הגבלה',
      'תמיכה ייעודית',
      'אינטגרציות מותאמות',
      'אחסון וידאו 200GB',
      'SSO ואבטחה מתקדמת',
      'מנהל חשבון ייעודי'
    ],
    limits: {
      events_per_month: -1,
      participants_per_event: -1,
      video_storage_gb: 200,
      custom_templates: true,
      custom_branding: true,
      advanced_analytics: true,
      sso: true,
      dedicated_support: true
    }
  }
}

// Per-event pricing for pay-as-you-go
export const EVENT_PRICING = {
  SMALL: {
    id: 'event-small',
    name: 'אירוע קטן',
    price: 49,
    currency: 'ILS',
    stripePriceId: process.env.STRIPE_EVENT_SMALL_PRICE_ID,
    maxParticipants: 50,
    description: 'מושלם לחגיגות משפחתיות ואירועים קטנים'
  },
  MEDIUM: {
    id: 'event-medium', 
    name: 'אירוע בינוני',
    price: 89,
    currency: 'ILS',
    stripePriceId: process.env.STRIPE_EVENT_MEDIUM_PRICE_ID,
    maxParticipants: 150,
    description: 'אידיאלי לימי הולדת גדולים ואירועי חברה'
  },
  LARGE: {
    id: 'event-large',
    name: 'אירוע גדול', 
    price: 149,
    currency: 'ILS',
    stripePriceId: process.env.STRIPE_EVENT_LARGE_PRICE_ID,
    maxParticipants: 300,
    description: 'מתאים לאירועי חברה גדולים ופסטיבלים'
  }
}

export type PricingPlan = keyof typeof PRICING_PLANS
export type EventPricing = keyof typeof EVENT_PRICING

// Helper functions
export function formatPrice(amount: number, currency: string = 'ILS'): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function getPlanByStripeId(stripePriceId: string) {
  return Object.values(PRICING_PLANS).find(plan => plan.stripePriceId === stripePriceId)
}

export function getEventPricingByStripeId(stripePriceId: string) {
  return Object.values(EVENT_PRICING).find(pricing => pricing.stripePriceId === stripePriceId)
}