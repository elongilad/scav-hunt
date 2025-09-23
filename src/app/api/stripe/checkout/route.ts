import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICING_PLANS, EVENT_PRICING, type PricingPlan, type EventPricing } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { 
      planId, 
      eventPricingId, 
      eventId, 
      participantCount,
      successUrl, 
      cancelUrl 
    } = await request.json()

    const supabase = await createClient()
    const cookieStore = cookies()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'ההזדהות נדרשת' }, { status: 401 })
    }

    // Get organization
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id, orgs(name)')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'ארגון לא נמצא' }, { status: 404 })
    }

    let lineItems: any[] = []
    let mode: 'subscription' | 'payment' = 'payment'
    let metadata: Record<string, string> = {
      userId: user.id,
      orgId: orgMember.org_id,
      userEmail: user.email || ''
    }

    // Handle subscription plans
    if (planId && planId !== 'free') {
      const plan = PRICING_PLANS[planId as PricingPlan]
      if (!plan || !(plan as any).stripePriceId) {
        return NextResponse.json({ error: 'תכנית לא תקינה' }, { status: 400 })
      }

      mode = 'subscription'
      lineItems = [{
        price: (plan as any).stripePriceId,
        quantity: 1
      }]
      metadata.planId = planId
    }

    // Handle per-event pricing
    if (eventPricingId && eventId) {
      const eventPricing = EVENT_PRICING[eventPricingId as EventPricing]
      if (!eventPricing || !(eventPricing as any).stripePriceId) {
        return NextResponse.json({ error: 'תמחור אירוע לא תקין' }, { status: 400 })
      }

      // Verify event exists and belongs to user's org
      const { data: event } = await supabase
        .from('events')
        .select('id, child_name, participant_count')
        .eq('id', eventId)
        .eq('org_id', orgMember.org_id)
        .single()

      if (!event) {
        return NextResponse.json({ error: 'אירוע לא נמצא' }, { status: 404 })
      }

      // Check participant limit
      const actualParticipants = participantCount || event.participant_count || 0
      if (actualParticipants > eventPricing.maxParticipants) {
        return NextResponse.json({ 
          error: `מספר המשתתפים (${actualParticipants}) חורג מהמותר בתכנית זו (${eventPricing.maxParticipants})` 
        }, { status: 400 })
      }

      lineItems = [{
        price: (eventPricing as any).stripePriceId,
        quantity: 1
      }]
      metadata.eventId = eventId
      metadata.eventPricingId = eventPricingId
      metadata.participantCount = actualParticipants.toString()
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'פריטים לתשלום לא נמצאו' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || undefined,
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `${request.nextUrl.origin}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/dashboard/billing/cancel`,
      metadata: metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: metadata
        }
      })
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'שגיאה ביצירת תשלום' },
      { status: 500 }
    )
  }
}