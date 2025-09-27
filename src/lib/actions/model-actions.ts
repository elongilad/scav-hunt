'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { z } from 'zod'

const publishModelSchema = z.object({
  huntModelId: z.string().uuid(),
  isActive: z.boolean().default(true)
})

const instantiateEventSchema = z.object({
  modelVersionId: z.string().uuid(),
  title: z.string().min(1),
  locale: z.string().default('he')
})

const compileEventSchema = z.object({
  eventId: z.string().uuid()
})

export async function publishModelVersion(input: z.infer<typeof publishModelSchema>) {
  try {
    const user = await requireAuth()
    const { huntModelId } = publishModelSchema.parse(input)

    const supabase = createAdminClient()

    // Get hunt model to check org access
    const { data: huntModel } = await supabase
      .from('hunt_models')
      .select('org_id, name')
      .eq('id', huntModelId)
      .single()

    if (!huntModel) {
      throw new Error('Hunt model not found')
    }

    await requireOrgAccess(huntModel.org_id, 'editor')

    // Simply publish the model to the catalog
    const { error: publishError } = await supabase
      .from('hunt_models')
      .update({
        published: true,
        active: true
      })
      .eq('id', huntModelId)

    if (publishError) {
      throw new Error(`Failed to publish model to catalog: ${publishError?.message}`)
    }

    revalidatePath(`/admin/models/${huntModelId}`)
    revalidatePath('/admin/models')
    revalidatePath('/catalog')

    return {
      success: true,
      modelName: huntModel.name,
      message: 'Model published to catalog successfully'
    }

  } catch (error) {
    console.error('Error publishing model version:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function instantiateEvent(input: z.infer<typeof instantiateEventSchema>) {
  try {
    const user = await requireAuth()
    const { modelVersionId, title, locale } = instantiateEventSchema.parse(input)

    const supabase = createAdminClient()

    // For now, simplified version - just create a basic event
    // In the marketplace, the Stripe webhook will handle this
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        child_name: title,
        locale,
        buyer_user_id: user.id,
        model_id: modelVersionId, // treating modelVersionId as model_id for simplicity
        status: 'draft'
      })
      .select()
      .single()

    if (eventError || !event) {
      throw new Error(`Failed to create event: ${eventError?.message}`)
    }

    revalidatePath('/admin/events')
    revalidatePath(`/dashboard/events`)

    return {
      success: true,
      eventId: event.id,
      eventTitle: title,
      message: 'Event created successfully'
    }

  } catch (error) {
    console.error('Error instantiating event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function compileEvent(input: z.infer<typeof compileEventSchema>) {
  try {
    const user = await requireAuth()
    const { eventId } = compileEventSchema.parse(input)

    const supabase = createAdminClient()

    // Get event with org info
    const { data: event } = await supabase
      .from('events')
      .select('org_id, child_name, model_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      throw new Error('Event not found')
    }

    await requireOrgAccess(event.org_id, 'editor')

    // For marketplace events, compilation is simplified
    // Just mark the event as ready since it's a purchased template
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'ready' })
      .eq('id', eventId)

    if (updateError) {
      throw new Error(`Failed to update event status: ${updateError.message}`)
    }

    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath(`/dashboard/events/${eventId}`)

    return {
      success: true,
      message: 'Event compiled and ready to use'
    }

  } catch (error) {
    console.error('Error compiling event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}