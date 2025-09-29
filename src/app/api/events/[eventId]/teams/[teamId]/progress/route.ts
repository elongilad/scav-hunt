import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; teamId: string }> }
) {
  try {
    const resolvedParams = await params
    const { eventId, teamId } = resolvedParams
    const adminSupabase = createAdminClient()

    // Verify team belongs to this event
    const { data: team, error: teamError } = await adminSupabase
      .from('event_teams')
      .select('id, event_id, password')
      .eq('id', teamId)
      .eq('event_id', eventId)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found in this quest' },
        { status: 404 }
      )
    }

    // Get team progress
    const { data: progress, error: progressError } = await adminSupabase
      .from('team_progress')
      .select('*')
      .eq('team_id', teamId)
      .order('start_time')

    if (progressError) {
      console.error('Error fetching team progress:', progressError)
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    // Get quest stations for context
    const { data: quest } = await adminSupabase
      .from('events')
      .select('model_id')
      .eq('id', eventId)
      .single()

    const { data: stations } = await adminSupabase
      .from('model_stations')
      .select('id, display_name, sequence, estimated_duration')
      .eq('model_id', quest?.model_id)
      .order('sequence')

    // Calculate statistics
    const completedStations = progress?.filter(p => p.status === 'completed').length || 0
    const totalScore = progress?.reduce((sum, p) => sum + (p.score_earned || 0), 0) || 0
    const totalStations = stations?.length || 0
    const progressPercentage = totalStations > 0 ? (completedStations / totalStations) * 100 : 0

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        eventId: team.event_id,
        teamCode: team.password
      },
      progress: progress || [],
      stations: stations || [],
      statistics: {
        completedStations,
        totalStations,
        totalScore,
        progressPercentage: Math.round(progressPercentage)
      }
    })

  } catch (error) {
    console.error('Team progress API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; teamId: string }> }
) {
  try {
    const resolvedParams = await params
    const { eventId, teamId } = resolvedParams
    const { stationId, completed, scoreEarned, notes } = await req.json()

    if (!stationId) {
      return NextResponse.json(
        { error: 'Station ID is required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Verify team belongs to this event
    const { data: team, error: teamError } = await adminSupabase
      .from('event_teams')
      .select('id, event_id')
      .eq('id', teamId)
      .eq('event_id', eventId)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found in this quest' },
        { status: 404 }
      )
    }

    // Update or create progress record
    const progressData = {
      team_id: teamId,
      station_id: stationId,
      status: completed ? 'completed' : 'in_progress',
      score_earned: scoreEarned || 0,
      notes: notes || null,
      completion_time: completed ? new Date().toISOString() : null,
      start_time: new Date().toISOString()
    }

    const { error: progressError } = await adminSupabase
      .from('team_progress')
      .upsert(progressData)

    if (progressError) {
      console.error('Error updating team progress:', progressError)
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    // Update team's current station and total score
    if (completed) {
      const { data: allProgress } = await adminSupabase
        .from('team_progress')
        .select('score_earned')
        .eq('team_id', teamId)
        .eq('status', 'completed')

      const totalScore = allProgress?.reduce((sum, p) => sum + (p.score_earned || 0), 0) || 0

      await adminSupabase
        .from('event_teams')
        .update({
          current_station_id: null, // Clear current station when completed
          total_score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
    } else {
      await adminSupabase
        .from('event_teams')
        .update({
          current_station_id: stationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'Station completed successfully' : 'Station progress updated'
    })

  } catch (error) {
    console.error('Team progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}