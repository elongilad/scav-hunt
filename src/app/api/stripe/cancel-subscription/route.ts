import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { orgId } = await request.json()

    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'ההזדהות נדרשת' }, { status: 401 })
    }

    // Verify user is admin of the org
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single()

    if (!orgMember || orgMember.role !== 'admin') {
      return NextResponse.json({ error: 'אין הרשאה לבטל מנוי' }, { status: 403 })
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('stripe_subscription_id')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'מנוי לא נמצא' }, { status: 404 })
    }

    // Cancel subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    )

    // Update database
    await supabase
      .from('org_subscriptions')
      .update({
        status: 'canceling',
        cancel_at_period_end: true,
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id)

    return NextResponse.json({ 
      success: true,
      cancelDate: new Date((canceledSubscription as any).current_period_end * 1000)
    })

  } catch (error: any) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'שגיאה בביטול המנוי' },
      { status: 500 }
    )
  }
}