'use client'

import { useLanguage } from '@/contexts/LanguageContext';
import { CardHover } from "@/components/ui/card";
import Button from "@/components/ui/button";

const questTemplates = [
  {
    id: 'spy-mission',
    name: 'Secret Agent Mission',
    nameHe: 'משימת סוכן חשאי',
    description: 'Navigate a world of espionage with code-breaking, stealth challenges, and secret rendezvous points.',
    descriptionHe: 'נווטו בעולם הריגול עם פיצוח קודים, אתגרי התגנבות ונקודות מפגש חשאיות.',
    age: '8-14',
    duration: '45-60',
    stations: 8,
    teams: 6,
    price: '₪149',
    image: '/img/spy-quest.jpg',
    features: ['Code Breaking', 'Stealth Challenges', 'Secret Messages', 'Team Coordination'],
    featuresHe: ['פיצוח קודים', 'אתגרי התגנבות', 'הודעות חשאיות', 'תיאום צוותי'],
    popular: true
  },
  {
    id: 'pirate-treasure',
    name: 'Pirate Treasure Hunt',
    nameHe: 'ציד אוצר פיראטים',
    description: 'Ahoy matey! Search for buried treasure with map reading, riddles, and swashbuckling adventures.',
    descriptionHe: 'אהוי ימאי! חפשו אוצר קבור עם קריאת מפות, חידות והרפתקאות פיראטיות.',
    age: '6-12',
    duration: '30-45',
    stations: 6,
    teams: 5,
    price: '₪129',
    image: '/img/pirate-quest.jpg',
    features: ['Treasure Maps', 'Riddle Solving', 'Adventure Stories', 'Creative Props'],
    featuresHe: ['מפות אוצר', 'פתרון חידות', 'סיפורי הרפתקאות', 'אביזרים יצירתיים']
  },
  {
    id: 'detective-mystery',
    name: 'Detective Mystery',
    nameHe: 'תעלומת בלש',
    description: 'Put on your detective hat and solve crimes using clues, evidence analysis, and logical deduction.',
    descriptionHe: 'חבשו כובע בלש ופתרו פשעים באמצעות רמזים, ניתוח ראיות והיגיון.',
    age: '10-16',
    duration: '60-75',
    stations: 10,
    teams: 8,
    price: '₪189',
    image: '/img/detective-quest.jpg',
    features: ['Crime Scenes', 'Evidence Analysis', 'Witness Interviews', 'Logic Puzzles'],
    featuresHe: ['זירות פשע', 'ניתוח ראיות', 'ראיונות עדים', 'חידות היגיון']
  },
  {
    id: 'space-exploration',
    name: 'Space Exploration',
    nameHe: 'חקר החלל',
    description: 'Blast off on an intergalactic adventure with alien encounters, space puzzles, and cosmic challenges.',
    descriptionHe: 'יורו להרפתקה בין-גלקטית עם מפגשי חייזרים, חידות חלל ואתגרים קוסמיים.',
    age: '8-14',
    duration: '50-65',
    stations: 9,
    teams: 7,
    price: '₪169',
    image: '/img/space-quest.jpg',
    features: ['Alien Languages', 'Space Navigation', 'Planetary Missions', 'STEM Challenges'],
    featuresHe: ['שפות חייזרים', 'ניווט חלל', 'משימות פלנטריות', 'אתגרי מדע']
  }
];

export default function QuestTemplates() {
  const { language } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-slate-50" id="quest-templates">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-semibold text-brand-navy font-display ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he' ? 'תבניות הרפתקאות מוכנות' : 'Ready-Made Adventure Templates'}
          </h2>
          <p className={`mt-4 text-lg text-slate-600 max-w-3xl mx-auto ${language === 'he' ? 'font-hebrew' : ''}`}>
            {language === 'he'
              ? 'בחרו מתבניות מקצועיות מוכנות לשימוש - כל אחת כוללת סיפור, משימות, אביזרים והוראות מפורטות'
              : 'Choose from professionally designed templates - each includes storyline, missions, props, and detailed instructions'
            }
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {questTemplates.map((template) => (
            <CardHover key={template.id} className={`relative overflow-hidden ${template.popular ? 'ring-2 ring-brand-gold ring-offset-2' : ''}`}>
              {template.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center rounded-full bg-brand-gold text-brand-navy px-3 py-1 text-sm font-semibold">
                    {language === 'he' ? 'הכי פופולרי' : 'Most Popular'}
                  </span>
                </div>
              )}

              <div className="aspect-video relative overflow-hidden rounded-t-xl">
                <img
                  src={template.image}
                  alt={language === 'he' ? template.nameHe : template.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`text-xl font-semibold text-brand-navy ${language === 'he' ? 'font-hebrew' : ''}`}>
                    {language === 'he' ? template.nameHe : template.name}
                  </h3>
                  <div className="text-2xl font-bold text-brand-navy">
                    {template.price}
                  </div>
                </div>

                <p className={`text-slate-600 mb-4 ${language === 'he' ? 'font-hebrew' : ''}`}>
                  {language === 'he' ? template.descriptionHe : template.description}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-brand-navy">{template.age}</div>
                    <div className="text-slate-500">{language === 'he' ? 'גילאים' : 'Ages'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-brand-navy">{template.duration}</div>
                    <div className="text-slate-500">{language === 'he' ? 'דקות' : 'Minutes'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-brand-navy">{template.stations}</div>
                    <div className="text-slate-500">{language === 'he' ? 'תחנות' : 'Stations'}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className={`font-medium text-brand-navy mb-2 ${language === 'he' ? 'font-hebrew' : ''}`}>
                    {language === 'he' ? 'כולל:' : 'Includes:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(language === 'he' ? template.featuresHe : template.features).map((feature) => (
                      <span
                        key={feature}
                        className={`inline-flex items-center rounded-full bg-brand-sky/20 text-brand-navy px-3 py-1 text-xs font-medium ${language === 'he' ? 'font-hebrew' : ''}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button href="/auth/signup" className="flex-1">
                    {language === 'he' ? 'רכישה עכשיו' : 'Purchase Now'}
                  </Button>
                  <Button
                    variant="secondary"
                    href="/demo"
                    className="px-4"
                  >
                    {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
                  </Button>
                </div>
              </div>
            </CardHover>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button href="/catalog" variant="secondary" className="px-8 py-3">
            {language === 'he' ? 'צפו בכל התבניות' : 'View All Templates'}
          </Button>
        </div>
      </div>
    </section>
  );
}