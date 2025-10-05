'use client'

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  // Defensive check for language context
  let language = 'en';

  try {
    const languageContext = useLanguage();
    language = languageContext.language;
  } catch (error) {
    // LanguageProvider not available, use default
  }

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <Image src="/logo-full.svg" alt="BuildaQuest" width={160} height={32} className="h-8" />
          </div>
          <p className="text-sm text-slate-600">
            {language === 'he' ? 'הפוך כל מקום לחידה.' : 'Turn any place into a quest.'}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-brand-navy mb-2">
            {language === 'he' ? 'מוצר' : 'Product'}
          </h4>
          <ul className="space-y-1 text-sm text-slate-700">
            <li><Link href="/#features">{language === 'he' ? 'תכונות' : 'Features'}</Link></li>
            <li><Link href="/demo">{language === 'he' ? 'הדגמה' : 'Demo'}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-brand-navy mb-2">
            {language === 'he' ? 'חברה' : 'Company'}
          </h4>
          <ul className="space-y-1 text-sm text-slate-700">
            <li><Link href="/contact">{language === 'he' ? 'צור קשר' : 'Contact'}</Link></li>
            <li><Link href="/privacy">{language === 'he' ? 'פרטיות' : 'Privacy'}</Link></li>
            <li><Link href="/terms">{language === 'he' ? 'תנאים' : 'Terms'}</Link></li>
          </ul>
        </div>
        <div className="text-sm text-slate-600">
          {language === 'he'
            ? `© ${new Date().getFullYear()} BuildaQuest. כל הזכויות שמורות.`
            : `© ${new Date().getFullYear()} BuildaQuest. All rights reserved.`
          }
        </div>
      </div>
    </footer>
  );
}