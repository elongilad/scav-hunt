import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'ההזדהות נדרשת' }, { status: 401 })
    }

    if (!customerId) {
      return NextResponse.json({ error: 'מזהה לקוח חסר' }, { status: 400 })
    }

    // Get customer invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
      status: 'paid'
    })

    const invoiceData = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url
    }))

    return NextResponse.json({ invoices: invoiceData })

  } catch (error: any) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json(
      { error: 'שגיאה בהבאת חשבוניות' },
      { status: 500 }
    )
  }
}