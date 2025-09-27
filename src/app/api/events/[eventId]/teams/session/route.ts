import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { teamCode } = await req.json();
  if (!teamCode || typeof teamCode !== 'string' || teamCode.length !== 4) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const supabase = await createClient();
  // Find team by event + code (password field in event_teams table)
  const { data: team, error } = await supabase
    .from('event_teams')
    .select('id, password')
    .eq('event_id', eventId)
    .eq('password', teamCode)
    .single();

  if (error || !team) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  // For MVP, we'll use a simple route ID derived from team ID
  // In a full implementation, this would be determined by the event's routing logic
  const routeId = team.id; // Simplified for MVP

  // no server session cookie; client will store locally
  return NextResponse.json({ teamId: team.id, routeId, teamCode: team.password });
}