import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireOrgAccess } from '@/lib/auth/server'
import { EventReportsClient } from './components/EventReportsClient'

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
    title: event?.name ? `Reports - ${event.name}` : 'Event Reports',
    description: 'Automated reports and insights for your scavenger hunt event'
  }
}

export default async function EventReportsPage({ params }: Props) {
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

  await requireOrgAccess(event.org_id, 'admin')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Event Reports
        </h1>
        <p className="text-gray-400">
          Automated reporting and comprehensive insights: {event.name}
        </p>
      </div>

      <EventReportsClient eventId={params.id} eventData={event} />
    </div>
  )
}