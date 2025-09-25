import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireOrgAccess } from '@/lib/auth/server'
import { LiveEventDashboard } from './components/LiveEventDashboard'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies })
  const { data: event } = await supabase
    .from('hunt_events')
    .select('name')
    .eq('id', params.id)
    .single()

  return {
    title: event?.name ? `Live Dashboard - ${event.name}` : 'Event Live Dashboard',
    description: 'Real-time monitoring and analytics for your scavenger hunt event'
  }
}

export default async function EventDashboardPage({ params }: Props) {
  const user = await requireAuth()
  const supabase = createServerComponentClient({ cookies })

  const { data: event, error } = await supabase
    .from('hunt_events')
    .select(`
      id, name, description, status, start_time, end_time,
      max_teams, org_id, settings,
      organization:organizations(name, id)
    `)
    .eq('id', params.id)
    .single()

  if (error || !event) {
    notFound()
  }

  await requireOrgAccess({
    userId: user.id,
    orgId: event.org_id,
    minRole: 'admin'
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Live Event Dashboard
        </h1>
        <p className="text-gray-400">
          Real-time monitoring and analytics: {event.name}
        </p>
      </div>

      <LiveEventDashboard eventId={params.id} eventData={event} />
    </div>
  )
}