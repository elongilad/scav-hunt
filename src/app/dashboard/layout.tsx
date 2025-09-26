import { requireAuth } from '@/lib/auth'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-sky via-white to-blue-50">
      <LanguageProvider>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </LanguageProvider>
    </div>
  )
}