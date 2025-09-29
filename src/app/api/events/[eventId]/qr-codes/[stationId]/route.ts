import { NextRequest, NextResponse } from 'next/server'
import { getUserAndOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateQRCodeBuffer, getStationScanUrl } from '@/lib/qr'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; stationId: string }> }
) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { eventId, stationId } = resolvedParams
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

    // Check if station exists
    const { data: station, error: stationError } = await adminSupabase
      .from('model_stations')
      .select('*')
      .eq('id', stationId)
      .eq('model_id', event.model_id)
      .single()

    if (stationError || !station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    // Generate QR code
    const scanURL = getStationScanUrl(eventId, stationId)
    const qrBuffer = await generateQRCodeBuffer(scanURL)

    // Return as PNG image
    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${station.display_name.replace(/[^a-zA-Z0-9]/g, '-')}.png"`
      }
    })

  } catch (error) {
    console.error('QR code download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}