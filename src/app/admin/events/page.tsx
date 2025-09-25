import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import EventsPageClient from '@/components/admin/EventsPageClient'

export default async function AdminEventsPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get events for user's organizations
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      locale,
      status,
      created_at,
      org_id,
      buyer_user_id,
      model_version_id,
      orgs (name),
      model_versions (
        version_number,
        hunt_models (
          name,
          description
        )
      )
    `)
    .in('org_id', (orgs as any[]).map(org => org.id))
    .order('created_at', { ascending: false })

  // Get render jobs statistics for each event
  const eventIds = events?.map(e => e.id) || []
  const { data: renderJobsStats } = eventIds.length > 0 ? await supabase
    .from('render_jobs')
    .select('event_id, status')
    .in('event_id', eventIds) : { data: [] }

  // Aggregate render job stats by event
  const renderStatsByEvent = (renderJobsStats || []).reduce((acc: any, job: any) => {
    if (!acc[job.event_id]) {
      acc[job.event_id] = { total: 0, completed: 0, failed: 0, processing: 0 }
    }
    acc[job.event_id].total++
    if (job.status === 'completed') acc[job.event_id].completed++
    else if (job.status === 'failed') acc[job.event_id].failed++
    else if (job.status === 'processing') acc[job.event_id].processing++
    return acc
  }, {})


  return (
    <EventsPageClient
      events={events || []}
      renderStatsByEvent={renderStatsByEvent}
    />
  )
}