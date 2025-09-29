import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; stationId: string }> }
) {
  try {
    const resolvedParams = await params
    const { eventId, stationId } = resolvedParams
    const adminSupabase = createAdminClient()

    // First verify the quest is active
    const { data: quest, error: questError } = await adminSupabase
      .from('events')
      .select('id, status, model_id')
      .eq('id', eventId)
      .eq('status', 'active')
      .single()

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest not found or not active' },
        { status: 404 }
      )
    }

    // Get station information
    const { data: station, error: stationError } = await adminSupabase
      .from('model_stations')
      .select('id, display_name, description, sequence, station_type, activity_description, props_needed, estimated_duration')
      .eq('id', stationId)
      .eq('model_id', quest.model_id)
      .single()

    if (stationError || !station) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      station: {
        id: station.id,
        displayName: station.display_name,
        description: station.description,
        sequence: station.sequence,
        stationType: station.station_type,
        activityDescription: station.activity_description,
        propsNeeded: station.props_needed,
        estimatedDuration: station.estimated_duration
      }
    })

  } catch (error) {
    console.error('Public station access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}