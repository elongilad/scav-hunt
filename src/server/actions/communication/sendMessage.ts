'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requireOrgAccess } from '@/lib/auth/requireOrgAccess'

const Input = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  messageType: z.enum(['text', 'image', 'announcement', 'hint', 'emergency']),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
  isUrgent: z.boolean().optional(),
  parentMessageId: z.string().uuid().optional()
})

export async function sendMessage(input: z.infer<typeof Input>) {
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

  // Verify org access
  await requireOrgAccess({
    userId: user.id,
    orgId: event.org_id,
    minRole: 'viewer'
  })

  // Determine sender type
  let senderType: 'team' | 'organizer' | 'system' = 'organizer'

  // Check if user is a team member
  if (p.teamId) {
    const { data: teamMember } = await supabase
      .from('hunt_teams')
      .select('id')
      .eq('id', p.teamId)
      .eq('event_id', p.eventId)
      .single()

    if (teamMember) {
      senderType = 'team'
    }
  }

  // Insert the message
  const { data: message, error: insertError } = await supabase
    .from('team_messages')
    .insert({
      event_id: p.eventId,
      team_id: p.teamId,
      sender_id: user.id,
      sender_type: senderType,
      message_type: p.messageType,
      content: p.content,
      metadata: p.metadata || {},
      is_urgent: p.isUrgent || false,
      parent_message_id: p.parentMessageId
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('Error inserting message:', insertError)
    return { ok: false, error: 'Failed to send message' }
  }

  // If this is an urgent message, create notifications
  if (p.isUrgent || p.messageType === 'emergency') {
    await createUrgentNotification(supabase, p.eventId, p.teamId, message.id, p.content)
  }

  return { ok: true, message }
}

async function createUrgentNotification(
  supabase: any,
  eventId: string,
  teamId: string | undefined,
  messageId: string,
  content: string
) {
  await supabase
    .from('team_notifications')
    .insert({
      event_id: eventId,
      team_id: teamId,
      notification_type: 'emergency',
      title: 'Urgent Message',
      message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      data: { message_id: messageId }
    })
}