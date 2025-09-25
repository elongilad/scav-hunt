'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requireOrgAccess } from '@/lib/auth/requireOrgAccess'

const Input = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  announcementType: z.enum(['general', 'urgent', 'hint', 'schedule_change', 'weather', 'safety']),
  isPinned: z.boolean().optional(),
  targetTeams: z.array(z.string().uuid()).optional()
})

export async function sendAnnouncement(input: z.infer<typeof Input>) {
  const p = Input.parse(input)
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get event details and verify access
  const { data: event, error: eventError } = await supabase
    .from('hunt_events')
    .select('id, org_id, name, status')
    .eq('id', p.eventId)
    .single()

  if (eventError || !event) {
    return { ok: false, error: 'Event not found' }
  }

  // Verify org access (only organizers can send announcements)
  await requireOrgAccess({
    userId: user.id,
    orgId: event.org_id,
    minRole: 'admin'
  })

  // Insert the announcement
  const { data: announcement, error: insertError } = await supabase
    .from('team_announcements')
    .insert({
      event_id: p.eventId,
      author_id: user.id,
      title: p.title,
      content: p.content,
      announcement_type: p.announcementType,
      is_pinned: p.isPinned || false,
      target_teams: p.targetTeams || []
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('Error inserting announcement:', insertError)
    return { ok: false, error: 'Failed to send announcement' }
  }

  // Create notifications for all affected teams
  await createAnnouncementNotifications(supabase, p.eventId, p.targetTeams, announcement.id, p.title, p.content, p.announcementType)

  return { ok: true, announcement }
}

async function createAnnouncementNotifications(
  supabase: any,
  eventId: string,
  targetTeams: string[] | undefined,
  announcementId: string,
  title: string,
  content: string,
  announcementType: string
) {
  // Determine notification type based on announcement type
  let notificationType = 'event_update'
  if (announcementType === 'urgent' || announcementType === 'safety') {
    notificationType = 'emergency'
  } else if (announcementType === 'hint') {
    notificationType = 'hint_available'
  }

  // If no target teams specified, create broadcast notification
  if (!targetTeams || targetTeams.length === 0) {
    await supabase
      .from('team_notifications')
      .insert({
        event_id: eventId,
        team_id: null, // Broadcast to all teams
        notification_type: notificationType,
        title: title,
        message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        data: { announcement_id: announcementId, announcement_type: announcementType }
      })
  } else {
    // Create notifications for specific teams
    const notifications = targetTeams.map(teamId => ({
      event_id: eventId,
      team_id: teamId,
      notification_type: notificationType,
      title: title,
      message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      data: { announcement_id: announcementId, announcement_type: announcementType }
    }))

    await supabase
      .from('team_notifications')
      .insert(notifications)
  }
}