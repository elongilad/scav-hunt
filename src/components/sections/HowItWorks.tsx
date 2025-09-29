'use client'

import { useLanguage } from '@/contexts/LanguageContext';

const steps = [
  {
    step: '01',
    icon: '🛒',
    title: 'Choose & Buy',
    titleHe: 'בחרו ורכשו',
    description: 'Browse our marketplace and purchase the perfect quest template for your event.',
    descriptionHe: 'עיינו בשוק שלנו ורכשו את תבנית ההרפתקה המושלמת לאירוע שלכם.'
  },
  {
    step: '02',
    icon: '⚙️',
    title: 'Quick Setup',
    titleHe: 'הקמה מהירה',
    description: 'Customize locations, teams, and details with our guided 15-minute setup wizard.',
    descriptionHe: 'התאימו מיקומים, צוותים ופרטים עם אשף ההקמה המונחה של 15 דקות.'
  },
  {
    step: '03',
    icon: '📄',
    title: 'Print Materials',
    titleHe: 'הדפיסו חומרים',
    description: 'Download and print QR codes, clues, props, and organizer instructions.',
    descriptionHe: 'הורידו והדפיסו קודי QR, רמזים, אביזרים והוראות למארגנים.'
  },
  {
    step: '04',
    icon: '🎮',
    title: 'Play & Track',
    titleHe: 'שחקו ועקבו',
    description: 'Teams scan QR codes to start. Monitor live progress and celebrate completion!',
    descriptionHe: 'צוותים סורקים קודי QR כדי להתחיל. עקבו אחר התקדמות חיה וחגגו השלמה!'
  }
];

export default function HowItWorks() {
  const { language } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-white" id="how-it-works">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-semibold text-brand-navy font-display ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he' ? 'איך זה עובד' : 'How It Works'}
          </h2>
          <p className={`mt-4 text-lg text-slate-600 max-w-3xl mx-auto ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he'
              ? 'מהזמנה לחוויה בארבעה צעדים פשוטים - ללא צורך בידע טכני'
              : 'From order to experience in four simple steps - no technical knowledge required'
            }
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.step} className="relative text-center group">
              {/* Connection line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-brand-sky to-transparent -translate-x-4 z-0" />
              )}

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navy text-white text-2xl mb-4 group-hover:bg-brand-teal transition-colors">
                  {step.icon}
                </div>

                <div className={`text-sm font-semibold text-brand-gold mb-2 ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {language === 'he' ? `שלב ${step.step}` : `Step ${step.step}`}
                </div>

                <h3 className={`text-xl font-semibold text-brand-navy mb-3 ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {language === 'he' ? step.titleHe : step.title}
                </h3>

                <p className={`text-slate-600 ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {language === 'he' ? step.descriptionHe : step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <div className={`inline-flex items-center space-x-2 bg-brand-sky/20 rounded-full px-6 py-3 ${language === 'he' ? 'font-hebrew' : ''}`}>
            <span className="text-brand-navy font-medium">
              {language === 'he' ? '⏱️ מתחילים תוך 15 דקות' : '⏱️ Get started in 15 minutes'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}