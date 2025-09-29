'use client'

import { useLanguage } from '@/contexts/LanguageContext';

const features = [
  {
    icon: '🎯',
    title: 'Professional Templates',
    titleHe: 'תבניות מקצועיות',
    description: 'Carefully crafted storylines with balanced challenges and engaging narratives.',
    descriptionHe: 'קווי עלילה מעוצבים בקפידה עם אתגרים מאוזנים וסיפורים מרתקים.'
  },
  {
    icon: '📱',
    title: 'Mobile-First Experience',
    titleHe: 'חוויה ממוטבת לנייד',
    description: 'Teams scan QR codes and complete challenges using any smartphone.',
    descriptionHe: 'צוותים סורקים קודי QR ומשלימים אתגרים באמצעות כל סמארטפון.'
  },
  {
    icon: '🏃‍♂️',
    title: 'Live Team Tracking',
    titleHe: 'מעקב צוותים חי',
    description: 'Monitor progress in real-time with live leaderboards and completion status.',
    descriptionHe: 'עקבו אחר התקדמות בזמן אמת עם לוחות תוצאות חיים וסטטוס השלמה.'
  },
  {
    icon: '🧩',
    title: 'Smart Routing',
    titleHe: 'ניווט חכם',
    description: 'Automatic route optimization prevents bottlenecks and ensures smooth gameplay.',
    descriptionHe: 'אופטימיזציה אוטומטית של מסלולים מונעת צווארי בקבוק ומבטיחה משחק חלק.'
  },
  {
    icon: '🎬',
    title: 'Video Highlights',
    titleHe: 'סרטון תקציר',
    description: 'Automatically generate personalized highlight videos from team recordings.',
    descriptionHe: 'יצירה אוטומטית של סרטוני תקציר מותאמים אישית מהקלטות הצוותים.'
  },
  {
    icon: '⚡',
    title: 'Instant Setup',
    titleHe: 'הקמה מיידית',
    description: 'From purchase to play in under 15 minutes with guided setup wizard.',
    descriptionHe: 'מרכישה למשחק תוך פחות מ-15 דקות עם אשף הקמה מונחה.'
  }
];

export default function Features() {
  const { language } = useLanguage();

  return (
    <section className="py-16 md:py-24" id="features">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-semibold text-brand-navy font-display ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he' ? 'למה BuildaQuest?' : 'Why BuildaQuest?'}
          </h2>
          <p className={`mt-4 text-lg text-slate-600 max-w-3xl mx-auto ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he'
              ? 'הטכנולוגיה המתקדמת ביותר לציד מטמון עם חוויה חלקה הן למארגנים והן למשתתפים'
              : 'The most advanced scavenger hunt technology with seamless experience for both organizers and participants'
            }
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-sky/20 text-3xl mb-4 group-hover:bg-brand-sky/30 transition-colors">
                {feature.icon}
              </div>
              <h3 className={`text-xl font-semibold text-brand-navy mb-3 ${language === 'he' ? 'font-hebrew' : ''}`}>
                {language === 'he' ? feature.titleHe : feature.title}
              </h3>
              <p className={`text-slate-600 ${language === 'he' ? 'font-hebrew' : ''}`}>
                {language === 'he' ? feature.descriptionHe : feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}