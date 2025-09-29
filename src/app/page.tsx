import { LanguageProvider } from '@/contexts/LanguageContext'
import { HomePage } from '@/components/HomePage'

export default async function Page() {
  // Show marketplace homepage to everyone - no redirect for logged-in users
  return (
    <LanguageProvider>
      <HomePage />
    </LanguageProvider>
  );
}
