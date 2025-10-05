'use client'

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "./ui/language-toggle";

export function Header() {
  // Defensive check for language context
  let language = 'en';
  let hasLanguageContext = true;

  try {
    const languageContext = useLanguage();
    language = languageContext.language;
  } catch (error) {
    // LanguageProvider not available, use default
    hasLanguageContext = false;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="mx-auto max-w-7xl pr-4 sm:pr-6 lg:pr-8 h-16 flex items-center">
        <Link href="/" className="flex items-center mr-8 pl-4 sm:pl-6 lg:pl-2" aria-label="BuildaQuest Home">
          <Image src="/logo-full.svg" alt="BuildaQuest" width={320} height={64} className="h-16" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm ml-auto">
          <Link href="/#features" className="hover:text-brand-navy">
            {language === 'he' ? 'תכונות' : 'Features'}
          </Link>
          <Link href="/demo" className="hover:text-brand-navy">
            {language === 'he' ? 'הדגמה' : 'Demo'}
          </Link>
          <Link href="/contact" className="hover:text-brand-navy">
            {language === 'he' ? 'צור קשר' : 'Contact'}
          </Link>
          <div className="flex items-center gap-3 ml-4">
            {hasLanguageContext && <LanguageToggle />}
            <Link href="/auth/login" className="text-brand-navy hover:text-brand-teal">
              {language === 'he' ? 'התחבר' : 'Login'}
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center rounded-lg bg-brand-navy text-white px-4 py-2 hover:opacity-90">
              {language === 'he' ? 'התחל לבנות' : 'Start Building'}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}