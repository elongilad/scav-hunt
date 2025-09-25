'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface CreateStationData {
  id: string
  model_id: string
  display_name: string
  type: string
  default_activity: {
    description: string
    instructions: string
    props_needed: string[]
    estimated_duration_minutes: number
  }
}

export async function createStation(data: CreateStationData) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth()

    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate required fields
    if (!data.id?.trim()) {
      return { error: 'מזהה העמדה נדרש' }
    }

    if (!data.display_name?.trim()) {
      return { error: 'שם התצוגה נדרש' }
    }

    if (!data.type) {
      return { error: 'יש לבחור סוג עמדה' }
    }

    if (!data.default_activity?.description?.trim()) {
      return { error: 'תיאור הפעילות נדרש' }
    }

    // Create the station
    const { error } = await supabase
      .from('model_stations')
      .insert({
        id: data.id.trim(),
        model_id: data.model_id,
        display_name: data.display_name.trim(),
        type: data.type,
        default_activity: data.default_activity
      })

    if (error) {
      console.error('Station creation error:', error)

      if (error.code === '23505') { // Unique constraint violation
        return { error: 'מזהה העמדה כבר קיים' }
      }

      return { error: 'שגיאה ביצירת העמדה: ' + error.message }
    }

    // Revalidate the model detail page to show the new station
    revalidatePath(`/admin/models/${data.model_id}`)

    // Redirect to model detail page
    redirect(`/admin/models/${data.model_id}`)

  } catch (error: any) {
    console.error('Server action error:', error)
    return { error: 'שגיאה בשרת: ' + (error.message || 'שגיאה לא צפויה') }
  }
}