'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { z } from 'zod'

const updateStationOverrideSchema = z.object({
  eventId: z.string().uuid(),
  stationId: z.string(),
  enabled: z.boolean(),
  overrideDisplayName: z.string().nullable().optional(),
  overrideActivity: z.any().nullable().optional()
})

const updateMissionOverrideSchema = z.object({
  eventId: z.string().uuid(),
  missionId: z.string(),
  enabled: z.boolean(),
  overrideTitle: z.string().nullable().optional(),
  overrideClue: z.any().nullable().optional(),
  overrideVideoTemplateId: z.string().nullable().optional()
})

export async function updateStationOverride(input: z.infer<typeof updateStationOverrideSchema>) {
  try {
    const user = await requireAuth()
    const { eventId, stationId, enabled, overrideDisplayName, overrideActivity } =
      updateStationOverrideSchema.parse(input)

    const supabase = createAdminClient()

    // Get event to check org access
    const { data: event } = await supabase
      .from('events')
      .select('org_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      throw new Error('Event not found')
    }

    await requireOrgAccess(event.org_id, 'editor')

    // Update or create station override
    const { data, error } = await supabase
      .from('event_station_overrides')
      .upsert({
        event_id: eventId,
        station_id: stationId,
        enabled_override: enabled,
        override_display_name: enabled ? overrideDisplayName : null,
        override_activity: enabled ? overrideActivity : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,station_id'
      })
      .select()

    if (error) {
      throw new Error(`Failed to update station override: ${error.message}`)
    }

    revalidatePath(`/admin/events/${eventId}`)

    return {
      success: true,
      override: data?.[0]
    }

  } catch (error) {
    console.error('Error updating station override:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function updateMissionOverride(input: z.infer<typeof updateMissionOverrideSchema>) {
  try {
    const user = await requireAuth()
    const { eventId, missionId, enabled, overrideTitle, overrideClue, overrideVideoTemplateId } =
      updateMissionOverrideSchema.parse(input)

    const supabase = createAdminClient()

    // Get event to check org access
    const { data: event } = await supabase
      .from('events')
      .select('org_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      throw new Error('Event not found')
    }

    await requireOrgAccess(event.org_id, 'editor')

    // Update or create mission override
    const { data, error } = await supabase
      .from('event_mission_overrides')
      .upsert({
        event_id: eventId,
        mission_id: missionId,
        enabled_override: enabled,
        override_title: enabled ? overrideTitle : null,
        override_clue: enabled ? overrideClue : null,
        override_video_template_id: enabled ? overrideVideoTemplateId : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,mission_id'
      })
      .select()

    if (error) {
      throw new Error(`Failed to update mission override: ${error.message}`)
    }

    revalidatePath(`/admin/events/${eventId}`)

    return {
      success: true,
      override: data?.[0]
    }

  } catch (error) {
    console.error('Error updating mission override:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}