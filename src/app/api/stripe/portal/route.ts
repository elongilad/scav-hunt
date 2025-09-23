import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { customerId, returnUrl } = await request.json()

    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'ההזדהות נדרשת' }, { status: 401 })
    }

    if (!customerId) {
      return NextResponse.json({ error: 'מזהה לקוח חסר' }, { status: 400 })
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${request.nextUrl.origin}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Customer portal error:', error)
    return NextResponse.json(
      { error: 'שגיאה ביצירת ממשק הניהול' },
      { status: 500 }
    )
  }
}