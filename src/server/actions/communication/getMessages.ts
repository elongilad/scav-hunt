'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requireOrgAccess } from '@/lib/auth/requireOrgAccess'

const Input = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  messageType: z.enum(['text', 'image', 'announcement', 'hint', 'emergency']).optional()
})

export async function getMessages(input: z.infer<typeof Input>) {
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
  await requireOrgAccess({ userId: user.id, orgId: event.org_id, minRole: 'viewer' })

  // Build query
  let query = supabase
    .from('team_messages')
    .select(`
      *
    `)
    .eq('event_id', p.eventId)
    .order('created_at', { ascending: false })

  // Filter by team if specified
  if (p.teamId) {
    query = query.or(`team_id.eq.${p.teamId},team_id.is.null`)
  }

  // Filter by message type if specified
  if (p.messageType) {
    query = query.eq('message_type', p.messageType)
  }

  // Add pagination
  if (p.limit) {
    query = query.limit(p.limit)
  }
  if (p.offset) {
    query = query.range(p.offset, p.offset + (p.limit || 20) - 1)
  }

  const { data: messages, error: messagesError } = await query

  if (messagesError) {
    console.error('Error fetching messages:', messagesError)
    return { ok: false, error: 'Failed to fetch messages' }
  }

  return { ok: true, messages }
}

const MarkAsReadInput = z.object({
  messageId: z.string().uuid()
})

export async function markMessageAsRead(input: z.infer<typeof MarkAsReadInput>) {
  const p = MarkAsReadInput.parse(input)
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('team_messages')
    .update({ is_read: true })
    .eq('id', p.messageId)

  if (error) {
    console.error('Error marking message as read:', error)
    return { ok: false, error: 'Failed to mark message as read' }
  }

  return { ok: true }
}