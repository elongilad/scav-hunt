import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns either a single renderUrl OR three segment URLs for fallback sequential playback
export async function GET(req: NextRequest, { params }: { params: { eventId: string; stationId: string } }) {
  const { eventId, stationId } = params;
  const routeId = req.nextUrl.searchParams.get('routeId');
  if (!routeId) return NextResponse.json({ error: 'routeId required' }, { status: 400 });

  const supabase = await createClient();

  // 1) Attempt to find compiled video from event_missions
  const { data: mission } = await supabase
    .from('event_missions')
    .select(`
      compiled_video_asset_id,
      compiled_status,
      compiled_video_asset:media_assets!compiled_video_asset_id(embed_url, storage_path)
    `)
    .eq('event_id', eventId)
    .eq('to_event_station_id', stationId)
    .single();

  if (mission?.compiled_status === 'ready' && mission.compiled_video_asset?.embed_url) {
    return NextResponse.json({
      kind: 'render',
      renderUrl: mission.compiled_video_asset.embed_url
    });
  }

  // 2) Fallback to segments (template intro/outro + user clip)
  // This is a simplified implementation - you might need to build this based on your data model
  const { data: station } = await supabase
    .from('event_stations')
    .select(`
      id,
      media_user_clip_id,
      user_clip:media_assets!media_user_clip_id(embed_url, storage_path),
      model_station:model_stations!model_station_id(
        id,
        display_name
      )
    `)
    .eq('id', stationId)
    .single();

  if (station?.user_clip?.embed_url) {
    // For MVP, we'll return the user clip as the main content
    // In a full implementation, you'd construct intro/outro from templates
    return NextResponse.json({
      kind: 'segments',
      intro_url: null, // Could be template intro
      user_clip_url: station.user_clip.embed_url,
      outro_url: null  // Could be template outro
    });
  }

  return NextResponse.json({ kind: 'none' });
}