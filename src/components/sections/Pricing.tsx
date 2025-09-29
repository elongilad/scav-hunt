'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import { CardHover } from "@/components/ui/card";

const tiers = [
  {
    name: "Starter Pack",
    nameHe: "חבילת מתחילים",
    price: "₪149",
    priceEn: "$39",
    originalPrice: "₪199",
    originalPriceEn: "$49",
    description: "Perfect for birthday parties and small gatherings",
    descriptionHe: "מושלם למסיבות יום הולדת והתכנסויות קטנות",
    features: ["Up to 6 teams", "8-10 stations", "1 quest template", "Email support", "Mobile app access"],
    featuresHe: ["עד 6 צוותים", "8-10 תחנות", "תבנית הרפתקה אחת", "תמיכת אימייל", "גישה לאפליקציה"],
    cta: { label: "Get Started", labelHe: "התחילו עכשיו", href: "/catalog?tier=starter" },
    popular: false,
    badge: "Save ₪50",
    badgeHe: "חסכו ₪50"
  },
  {
    name: "Family Fun",
    nameHe: "כיף משפחתי",
    price: "₪249",
    priceEn: "$65",
    originalPrice: "₪329",
    originalPriceEn: "$89",
    description: "Great for family events and community gatherings",
    descriptionHe: "מעולה לאירועי משפחה והתכנסויות קהילתיות",
    features: ["Up to 10 teams", "12-15 stations", "3 quest templates", "Phone support", "Live tracking", "Video highlights"],
    featuresHe: ["עד 10 צוותים", "12-15 תחנות", "3 תבניות הרפתקה", "תמיכה טלפונית", "מעקב חי", "סרטוני תקציר"],
    cta: { label: "Most Popular", labelHe: "הכי פופולרי", href: "/catalog?tier=family" },
    popular: true,
    badge: "Best Value",
    badgeHe: "הכי כדאי"
  },
  {
    name: "Pro Organizer",
    nameHe: "מארגן מקצועי",
    price: "₪449",
    priceEn: "$119",
    originalPrice: "₪599",
    originalPriceEn: "$159",
    description: "For schools, camps, and professional event organizers",
    descriptionHe: "לבתי ספר, מחנות ומארגני אירועים מקצועיים",
    features: ["Unlimited teams", "20+ stations", "All quest templates", "Priority support", "Custom branding", "Analytics dashboard"],
    featuresHe: ["צוותים ללא הגבלה", "20+ תחנות", "כל תבניות ההרפתקה", "תמיכה מועדפת", "מיתוג מותאם", "לוח בקרה אנליטי"],
    cta: { label: "Go Pro", labelHe: "הפכו למקצוענים", href: "/catalog?tier=pro" },
    popular: false,
    badge: "Save ₪150",
    badgeHe: "חסכו ₪150"
  },
];

export default function Pricing() {
  const { language } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-slate-50" id="pricing">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-semibold text-brand-navy font-display ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he' ? 'מחירים שקופים' : 'Transparent Pricing'}
          </h2>
          <p className={`mt-4 text-lg text-slate-600 max-w-3xl mx-auto ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he'
              ? 'בחרו את החבילה המתאימה לאירוע שלכם. כל החבילות כוללות גישה מלאה לפלטפורמה'
              : 'Choose the perfect package for your event. All packages include full platform access'
            }
          </p>

          {/* Limited time offer badge */}
          <div className={`inline-flex items-center mt-6 bg-brand-gold/20 border border-brand-gold rounded-full px-4 py-2 ${language === 'he' ? 'font-hebrew' : ''}`}>
            <span className="text-brand-navy font-medium">
              {language === 'he' ? '🔥 הצעה מוגבלת: הנחה של 25% על כל החבילות' : '🔥 Limited Time: 25% off all packages'}
            </span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <CardHover key={tier.name} className={`relative overflow-hidden ${tier.popular ? 'ring-2 ring-brand-gold ring-offset-2 transform scale-105' : ''}`}>
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-brand-gold text-brand-navy text-center py-2 font-semibold text-sm">
                  {language === 'he' ? tier.badgeHe : tier.badge}
                </div>
              )}

              {!tier.popular && tier.badge && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">
                    {language === 'he' ? tier.badgeHe : tier.badge}
                  </span>
                </div>
              )}

              <div className={`p-6 ${tier.popular ? 'pt-12' : ''}`}>
                <h3 className={`text-xl font-semibold text-brand-navy ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {language === 'he' ? tier.nameHe : tier.name}
                </h3>

                <p className={`mt-2 text-slate-600 ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {language === 'he' ? tier.descriptionHe : tier.description}
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-brand-navy">
                      {language === 'he' ? tier.price : tier.priceEn}
                    </span>
                    <span className="ml-2 text-lg text-slate-400 line-through">
                      {language === 'he' ? tier.originalPrice : tier.originalPriceEn}
                    </span>
                  </div>
                  <p className={`text-sm text-slate-500 mt-1 ${language === 'he' ? 'font-hebrew' : ''}`}>
                    {language === 'he' ? 'לאירוע אחד' : 'Per event'}
                  </p>
                </div>

                <ul className={`mt-6 space-y-3 ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {(language === 'he' ? tier.featuresHe : tier.features).map((feature) => (
                    <li key={feature} className="flex items-start">
                      <span className="text-brand-teal mr-2">✓</span>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.cta.href}
                  className={`mt-8 w-full inline-flex justify-center items-center rounded-lg px-6 py-3 font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-brand-gold text-brand-navy hover:bg-brand-gold/90'
                      : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                  } ${language === 'he' ? 'font-hebrew' : ''}`}
                >
                  {language === 'he' ? tier.cta.labelHe : tier.cta.label}
                </a>
              </div>
            </CardHover>
          ))}
        </div>

        {/* Additional info */}
        <div className="text-center mt-12">
          <p className={`text-slate-600 ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he'
              ? '💳 תשלום מאובטח · 🔄 החזר כספי תוך 30 יום · 📞 תמיכה 24/7'
              : '💳 Secure payment · 🔄 30-day money back · 📞 24/7 support'
            }
          </p>
        </div>
      </div>
    </section>
  );
}
