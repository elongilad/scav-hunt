import { requireAuth } from '@/lib/auth'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { NewEventPageClient } from './NewEventPageClient'

export default async function NewEventPage() {
  const user = await requireAuth()

  return (
    <LanguageProvider>
      <NewEventPageClient />
    </LanguageProvider>
  )
}