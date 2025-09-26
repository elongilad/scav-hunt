import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/LogoutButton'
import { EventsPageClient } from './EventsPageClient'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  Play,
  Clock,
  Users,
  MapPin,
  Video,
  FileText
} from 'lucide-react'

export default async function EventsPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get all events for user's organizations
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      child_name,
      child_age,
      date_start,
      date_end,
      status,
      participant_count,
      duration_minutes,
      model_id,
      created_at,
      orgs (name),
      hunt_models (
        name,
        description
      )
    `)
    .in('org_id', (orgs as any[]).map(org => org.id))
    .order('date_start', { ascending: false })

  // Get stats
  const totalEvents = events?.length || 0
  const activeEvents = events?.filter(e => e.status === 'active').length || 0
  const upcomingEvents = events?.filter(e =>
    e.status === 'ready' && e.date_start && new Date(e.date_start) > new Date()
  ).length || 0
  const completedEvents = events?.filter(e => e.status === 'completed').length || 0

  return (
    <EventsPageClient
      events={events || []}
      stats={{
        totalEvents,
        activeEvents,
        upcomingEvents,
        completedEvents
      }}
    />

  );
}