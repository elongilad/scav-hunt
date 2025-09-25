import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth, requireOrgAccess } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    // Use service role client for admin operations
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, get the model to check org ownership
    const { data: model, error: modelError } = await supabase
      .from('hunt_models')
      .select('org_id')
      .eq('id', id)
      .single()

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Check user has access to this organization
    await requireOrgAccess(model.org_id, 'admin')

    // Delete related records first (missions, stations, etc.)
    // Delete model missions
    await supabase
      .from('model_missions')
      .delete()
      .eq('model_id', id)

    // Delete model stations
    await supabase
      .from('model_stations')
      .delete()
      .eq('model_id', id)

    // Delete model versions
    await supabase
      .from('model_versions')
      .delete()
      .eq('model_id', id)

    // Finally, delete the model itself
    const { error: deleteError } = await supabase
      .from('hunt_models')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting model:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete model' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/models/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}