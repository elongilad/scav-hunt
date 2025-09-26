import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { HomePage } from '@/components/HomePage'

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <LanguageProvider>
      <HomePage />
    </LanguageProvider>
  );
}
