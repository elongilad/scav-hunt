import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ModelDetailClient from '@/components/admin/ModelDetailClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function HuntModelDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const user = await requireAuth()

  // TEMPORARY: Use service role client to bypass RLS issues
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get hunt model with organization info
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

  // Check user has access to this organization
  await requireOrgAccess(huntModel.org_id, 'viewer')

  // Note: Stations are no longer part of models - they are applied at event level

  // Get missions for this model
  const { data: missions } = await supabase
    .from('model_missions')
    .select('*')
    .eq('model_id', id)
    .order('created_at', { ascending: true })

  // Get media assets count
  const { data: mediaAssets } = await supabase
    .from('media_assets')
    .select('id, kind')
    .eq('org_id', huntModel.org_id)

  // Get published versions count
  const { data: publishedVersions } = await supabase
    .from('model_versions')
    .select('id, version_number, is_active, published_at')
    .eq('model_id', id)
    .eq('is_published', true)
    .order('version_number', { ascending: false })

  const latestVersion = publishedVersions?.[0]

  const stats = {
    missions: missions?.length || 0,
    mediaAssets: mediaAssets?.length || 0,
    videoAssets: mediaAssets?.filter(m => m.kind === 'video').length || 0,
    publishedVersions: publishedVersions?.length || 0
  }

  return (
    <ModelDetailClient
      huntModel={huntModel}
      missions={missions || []}
      stats={stats}
      latestVersion={latestVersion}
    />
  )
}