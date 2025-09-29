import { NextRequest, NextResponse } from 'next/server'
import { getUserAndOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.eventId
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Event not found:', eventError)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if event is already active
    if (event.status === 'active') {
      return NextResponse.json({ error: 'Quest is already active' }, { status: 400 })
    }

    // Validate that the event is ready for activation
    if (event.status !== 'ready' && event.status !== 'draft') {
      return NextResponse.json({
        error: 'Quest must be in ready or draft status to activate'
      }, { status: 400 })
    }

    // Get stations to verify quest is complete
    const { data: stations, error: stationsError } = await adminSupabase
      .from('model_stations')
      .select('*')
      .eq('model_id', event.model_id)

    if (stationsError || !stations || stations.length === 0) {
      return NextResponse.json({
        error: 'Quest must have stations to be activated'
      }, { status: 400 })
    }

    // Update event status to active
    const { error: updateError } = await supabase
      .from('events')
      .update({
        status: 'active',
        date_start: new Date().toISOString()
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Failed to activate quest:', updateError)
      return NextResponse.json({
        error: 'Failed to activate quest'
      }, { status: 500 })
    }

    console.log(`✅ Quest activated successfully: ${eventId}`)

    return NextResponse.json({
      success: true,
      message: 'Quest activated successfully',
      eventId,
      status: 'active',
      activatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Quest activation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}