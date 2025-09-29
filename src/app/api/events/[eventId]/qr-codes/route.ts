import { NextRequest, NextResponse } from 'next/server'
import { getUserAndOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEventQRCodes } from '@/lib/qr'

export async function GET(
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

    // Get stations for this event
    const { data: stations, error: stationsError } = await adminSupabase
      .from('model_stations')
      .select('*')
      .eq('model_id', event.model_id)

    if (stationsError || !stations || stations.length === 0) {
      return NextResponse.json({
        error: 'No stations found for this quest'
      }, { status: 404 })
    }

    // Generate QR codes for all stations
    console.log(`🔄 Generating QR codes for ${stations.length} stations...`)
    const qrCodes = await generateEventQRCodes(eventId, stations)

    console.log(`✅ Generated QR codes for event: ${eventId}`)

    return NextResponse.json({
      success: true,
      eventId,
      questName: event.child_name || 'Quest',
      qrCodes,
      stationCount: stations.length
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}