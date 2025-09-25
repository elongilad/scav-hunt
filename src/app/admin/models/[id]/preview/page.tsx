import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PreviewPageClient from '@/components/admin/PreviewPageClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PreviewModelPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const user = await requireAuth()

  // TEMPORARY: Use service role client to bypass RLS issues
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get hunt model with stations and missions
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

  // Note: Stations are no longer part of models - they are applied at event level

  // Get missions for this model
  const { data: missions } = await supabase
    .from('model_missions')
    .select('*')
    .eq('model_id', id)
    .order('created_at', { ascending: true })

  return <PreviewPageClient huntModel={huntModel} missions={missions || []} />
}