import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RoutingEngine } from '@/lib/routing/engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const teamId = searchParams.get('teamId')
    const eventId = searchParams.get('eventId')

    const engine = new RoutingEngine()

    switch (action) {
      case 'next-station':
        if (!teamId) {
          return NextResponse.json(
            { error: 'Missing teamId parameter' },
            { status: 400 }
          )
        }
        
        const currentStationId = searchParams.get('currentStationId')
        const routeDecision = await engine.getNextStation(teamId, currentStationId || undefined)
        
        return NextResponse.json({ routeDecision })

      case 'team-progress':
        if (!teamId) {
          return NextResponse.json(
            { error: 'Missing teamId parameter' },
            { status: 400 }
          )
        }
        
        const progress = await engine.getTeamProgress(teamId)
        return NextResponse.json({ progress })

      case 'leaderboard':
        if (!eventId) {
          return NextResponse.json(
            { error: 'Missing eventId parameter' },
            { status: 400 }
          )
        }
        
        const leaderboard = await engine.getEventLeaderboard(eventId)
        return NextResponse.json({ leaderboard })

      case 'event-status':
        if (!eventId) {
          return NextResponse.json(
            { error: 'Missing eventId parameter' },
            { status: 400 }
          )
        }
        
        const eventStatus = await engine.getEventStatus(eventId)
        return NextResponse.json({ eventStatus })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Routing API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, teamId, stationId, scoreEarned, userClips, notes, reason } = await request.json()

    if (!action || !teamId || !stationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const engine = new RoutingEngine()

    switch (action) {
      case 'start-station':
        await engine.startStation(teamId, stationId)
        
        return NextResponse.json({
          success: true,
          message: 'Station started successfully'
        })

      case 'complete-station':
        await engine.completeStation(
          teamId,
          stationId,
          scoreEarned || 0,
          userClips || [],
          notes
        )
        
        // Get next station recommendation
        const nextStation = await engine.getNextStation(teamId, stationId)
        
        return NextResponse.json({
          success: true,
          message: 'Station completed successfully',
          nextStation
        })

      case 'skip-station':
        await engine.skipStation(teamId, stationId, reason)
        
        return NextResponse.json({
          success: true,
          message: 'Station skipped'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Routing API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}