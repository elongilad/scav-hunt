import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createClient();

    // Look up the event via entitlements table
    const { data: entitlement } = await supabase
      .from('event_entitlements')
      .select(`
        id,
        event_id,
        events (
          id,
          child_name
        )
      `)
      .eq('stripe_checkout_session_id', sessionId)
      .eq('status', 'active')
      .single();

    if (entitlement && entitlement.event_id) {
      return NextResponse.json({
        eventId: entitlement.event_id,
        eventName: entitlement.events?.child_name || 'Quest Adventure',
      });
    }

    // Event not found yet
    return NextResponse.json({ eventId: null }, { status: 202 });
  } catch (error) {
    console.error('Verify checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}