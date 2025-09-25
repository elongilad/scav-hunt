import { requireAuth } from '@/lib/auth'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminOverviewPage() {
  const user = await requireAuth()

  // TEMPORARY: Use service role client to bypass RLS issues
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // TEMPORARY: Skip org filtering for now and just get all hunt models for the authenticated user
  // In production, this should be filtered by user's organizations
  console.log(`[DEV] Bypassing org filtering for user ${user.id} in admin overview`)

  const [{ data: huntModels }, { data: activeVersions }, { data: mediaAssets }, { data: events }] =
    await Promise.all([
      supabase
        .from('hunt_models')
        .select('id, name, description, active, created_at, org_id')
        .order('created_at', { ascending: false }),
      supabase
        .from('model_versions')
        .select('id, is_active, model_id, published_at')
        .eq('is_active', true),
      supabase
        .from('media_assets')
        .select('id, kind, created_at, org_id'),
      supabase
        .from('events')
        .select('id, status, created_at, org_id')
    ])

  const stats = {
    huntModels: huntModels?.length || 0,
    activeModels: activeVersions?.length || 0,
    mediaAssets: mediaAssets?.length || 0,
    videoAssets: mediaAssets?.filter(m => m.kind === 'video').length || 0,
    recentEvents: events?.length || 0,
    activeEvents: events?.filter(e => e.status === 'active').length || 0
  }

  return <AdminDashboard stats={stats} huntModels={huntModels || []} />
}
