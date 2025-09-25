'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface MissionData {
  id?: string
  model_id: string
  title: string
  clue: {
    text: string
    hint?: string
  }
  video_template_id?: string | null
  overlay_spec?: {
    title_position: { x: number; y: number }
    clue_position: { x: number; y: number }
    font_style: {
      family: string
      size: number
      color: string
      bold: boolean
    }
  }
  locale: 'he' | 'en'
  active: boolean
}

export async function updateMission(missionId: string, data: MissionData) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth()

    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate required fields
    if (!data.title?.trim()) {
      return { error: 'כותרת המשימה נדרשת' }
    }

    if (!data.clue?.text?.trim()) {
      return { error: 'טקסט הרמז נדרש' }
    }

    // Update the mission
    const { error } = await supabase
      .from('model_missions')
      .update({
        title: data.title.trim(),
        clue: data.clue,
        video_template_id: data.video_template_id,
        overlay_spec: data.overlay_spec,
        locale: data.locale,
        active: data.active
      })
      .eq('id', missionId)

    if (error) {
      console.error('Mission update error:', error)
      return { error: 'שגיאה בעדכון המשימה: ' + error.message }
    }

    // Revalidate the model detail page to show the updated mission
    revalidatePath(`/admin/models/${data.model_id}`)

    // Redirect to model detail page
    redirect(`/admin/models/${data.model_id}`)

  } catch (error: any) {
    console.error('Server action error:', error)
    // Don't return NEXT_REDIRECT as an error since it's expected behavior
    if (error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw to allow the redirect to work
    }
    return { error: 'שגיאה בשרת: ' + (error.message || 'שגיאה לא צפויה') }
  }
}

// Note: Stations are no longer part of models - they are applied at event level
// This function is kept for backwards compatibility but returns empty array
export async function getStations(modelId: string) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth()

    // Stations are no longer part of models
    return { stations: [] }

  } catch (error: any) {
    console.error('Server action error:', error)
    return { error: 'שגיאה בשרת: ' + (error.message || 'שגיאה לא צפויה') }
  }
}

export async function getMission(missionId: string) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth()

    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: mission, error } = await supabase
      .from('model_missions')
      .select(`
        id,
        model_id,
        title,
        clue,
        video_template_id,
        overlay_spec,
        locale,
        active,
        created_at
      `)
      .eq('id', missionId)
      .single()

    if (error) {
      console.error('Mission fetch error:', error)
      return { error: 'שגיאה בטעינת המשימה: ' + error.message }
    }

    return { mission }

  } catch (error: any) {
    console.error('Server action error:', error)
    return { error: 'שגיאה בשרת: ' + (error.message || 'שגיאה לא צפויה') }
  }
}

export async function createMission(data: MissionData) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth()

    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate required fields
    if (!data.title?.trim()) {
      return { error: 'כותרת המשימה נדרשת' }
    }

    if (!data.clue?.text?.trim()) {
      return { error: 'טקסט הרמז נדרש' }
    }

    // Create the mission
    const { error } = await supabase
      .from('model_missions')
      .insert({
        model_id: data.model_id,
        title: data.title.trim(),
        clue: data.clue,
        video_template_id: data.video_template_id,
        overlay_spec: data.overlay_spec,
        locale: data.locale,
        active: data.active
      })

    if (error) {
      console.error('Mission creation error:', error)
      return { error: 'שגיאה ביצירת המשימה: ' + error.message }
    }

    // Revalidate the model detail page to show the new mission
    revalidatePath(`/admin/models/${data.model_id}`)

    // Redirect to model detail page
    redirect(`/admin/models/${data.model_id}`)

  } catch (error: any) {
    console.error('Server action error:', error)
    // Don't return NEXT_REDIRECT as an error since it's expected behavior
    if (error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw to allow the redirect to work
    }
    return { error: 'שגיאה בשרת: ' + (error.message || 'שגיאה לא צפויה') }
  }
}