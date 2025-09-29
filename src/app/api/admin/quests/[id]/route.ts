import { NextRequest, NextResponse } from 'next/server'
import { getUserAndOrg } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const resolvedParams = await params
    const questId = resolvedParams.id

    // Get quest details with stations and missions
    const { data: quest, error } = await adminSupabase
      .from('hunt_models')
      .select(`
        id,
        name,
        description,
        locale,
        active,
        published,
        duration_min,
        age_min,
        age_max,
        cover_image_url,
        created_at,
        model_stations (
          id,
          display_name,
          type,
          default_activity
        ),
        model_missions (
          id,
          title,
          clue,
          to_station_id,
          active
        )
      `)
      .eq('id', questId)
      .eq('org_id', org.id)
      .single()

    if (error) {
      console.error('Error fetching quest:', error)
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      quest
    })

  } catch (error) {
    console.error('Quest fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const resolvedParams = await params
    const questId = resolvedParams.id
    const updates = await req.json()

    // Update the quest
    const { error } = await adminSupabase
      .from('hunt_models')
      .update(updates)
      .eq('id', questId)
      .eq('org_id', org.id)

    if (error) {
      console.error('Error updating quest:', error)
      return NextResponse.json(
        { error: 'Failed to update quest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quest updated successfully'
    })

  } catch (error) {
    console.error('Quest update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const resolvedParams = await params
    const questId = resolvedParams.id

    // Delete the quest (cascades to stations and missions)
    const { error } = await adminSupabase
      .from('hunt_models')
      .delete()
      .eq('id', questId)
      .eq('org_id', org.id)

    if (error) {
      console.error('Error deleting quest:', error)
      return NextResponse.json(
        { error: 'Failed to delete quest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quest deleted successfully'
    })

  } catch (error) {
    console.error('Quest delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}