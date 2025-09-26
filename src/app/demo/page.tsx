import { LanguageProvider } from '@/contexts/LanguageContext';
import { DemoPage } from '@/components/DemoPage';

export default function Page() {
  return (
    <LanguageProvider>
      <DemoPage />
    </LanguageProvider>
  );
}