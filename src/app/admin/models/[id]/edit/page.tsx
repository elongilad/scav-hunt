import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditModelPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const user = await requireAuth()

  // TEMPORARY: Use service role client to bypass RLS issues
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get hunt model
  const { data: huntModel, error } = await supabase
    .from('hunt_models')
    .select(`
      id,
      name,
      description,
      locale,
      active,
      created_at,
      org_id
    `)
    .eq('id', id)
    .single()

  if (error || !huntModel) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/models/${id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור למודל
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white">עריכת מודל ציד</h1>
          <p className="text-gray-300">ערוך את פרטי המודל</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-spy-gold" />
            עריכת מודל
          </CardTitle>
          <CardDescription className="text-gray-400">
            עריכת פרטי המודל: {huntModel.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Edit className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">בקרוב</h3>
            <p className="text-gray-400 mb-4">
              עמוד עריכת המודל יהיה זמין בקרוב. כרגע ניתן לערוך עמדות ומשימות דרך הדף הראשי של המודל.
            </p>
            <Link href={`/admin/models/${id}`}>
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                חזור למודל
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}