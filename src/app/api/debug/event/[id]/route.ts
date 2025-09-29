import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        child_name,
        model_id,
        status,
        hunt_models (name)
      `)
      .eq('id', id)
      .single();

    // Get stations for this model
    const { data: stationsData, error: stationsError } = await supabase
      .from('model_stations')
      .select('*')
      .eq('model_id', eventData?.model_id)
      .order('id');

    // Get all stations for debugging
    const { data: allStations } = await supabase
      .from('model_stations')
      .select('*')
      .order('model_id, id');

    return NextResponse.json({
      eventData,
      eventError,
      stationsData,
      stationsError,
      stationsCount: stationsData?.length || 0,
      allStationsCount: allStations?.length || 0,
      allStations: allStations?.map(s => ({
        id: s.id,
        model_id: s.model_id,
        display_name: s.display_name,
        type: s.type,
        hasActivity: !!s.default_activity
      }))
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}