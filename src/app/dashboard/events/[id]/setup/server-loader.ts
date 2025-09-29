import { createAdminClient } from '@/lib/supabase/admin';

export interface EventWithStations {
  id: string;
  child_name: string;
  model_id: string;
  status: string;
  hunt_models?: { name: string };
  stations: {
    id: string;
    station_id: string;
    display_name: string;
    station_type: string;
    activity_description: string;
    props_needed: string[];
  }[];
}

export async function loadEventAndStations(eventId: string): Promise<EventWithStations | null> {
  try {
    const supabase = createAdminClient();

    // Load event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        child_name,
        model_id,
        status,
        hunt_models (name)
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('❌ Server-side event query error:', eventError);
      return null;
    }

    // Load model stations
    const { data: stationsData, error: stationsError } = await supabase
      .from('model_stations')
      .select('*')
      .eq('model_id', eventData.model_id)
      .order('id');

    if (stationsError) {
      console.error('❌ Server-side stations query error:', stationsError);
    }

    // Transform stations to match the expected interface
    const transformedStations = stationsData?.map(station => {
      const activity = station.default_activity || {};

      return {
        id: station.id,
        station_id: activity.station_id || station.id.split('_').pop() || station.id.replace(/[^0-9]/g, '') || '1',
        display_name: station.display_name || 'Quest Station',
        station_type: activity.station_type || station.type || 'activity',
        activity_description: activity.description || activity.instructions || 'Complete this quest activity',
        props_needed: activity.props_needed || []
      };
    }) || [];

    return {
      ...eventData,
      stations: transformedStations
    } as unknown as EventWithStations;

  } catch (error) {
    console.error('💥 Server-side loader error:', error);
    return null;
  }
}