import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardPageClient } from './DashboardPageClient'

export default async function DashboardPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get recent events for the user's orgs
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      child_name,
      date_start,
      status,
      created_at,
      orgs (name)
    `)
    .in('org_id', (orgs as any[]).map(org => org.id))
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardPageClient
      user={user}
      orgs={orgs}
      events={events || []}
    />
  )
}