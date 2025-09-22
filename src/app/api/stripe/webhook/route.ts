import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanByStripeId, getEventPricingByStripeId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const { userId, orgId, planId, eventId, eventPricingId, participantCount } = session.metadata || {}

  if (!userId || !orgId) {
    throw new Error('Missing required metadata')
  }

  // Handle subscription plans
  if (planId && session.mode === 'subscription') {
    const plan = getPlanByStripeId(session.subscription as string)
    if (plan) {
      await supabase
        .from('org_subscriptions')
        .upsert({
          org_id: orgId,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          created_at: new Date(),
          updated_at: new Date()
        })
    }
  }

  // Handle per-event payments
  if (eventId && eventPricingId && session.mode === 'payment') {
    const eventPricing = getEventPricingByStripeId(eventPricingId)
    if (eventPricing) {
      // Create payment record
      await supabase
        .from('event_payments')
        .insert({
          event_id: eventId,
          org_id: orgId,
          stripe_payment_intent_id: session.payment_intent,
          stripe_customer_id: session.customer,
          amount: session.amount_total,
          currency: session.currency,
          pricing_tier: eventPricingId,
          participant_count: parseInt(participantCount || '0'),
          status: 'completed',
          created_at: new Date()
        })

      // Update event status to 'ready' if payment successful
      await supabase
        .from('events')
        .update({ 
          status: 'ready',
          updated_at: new Date()
        })
        .eq('id', eventId)
    }
  }

  // Log the transaction
  await supabase
    .from('payment_logs')
    .insert({
      org_id: orgId,
      user_id: userId,
      stripe_session_id: session.id,
      event_type: 'checkout.session.completed',
      amount: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      created_at: new Date()
    })
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  const { userId, orgId, planId } = subscription.metadata || {}

  if (!userId || !orgId || !planId) {
    throw new Error('Missing required metadata')
  }

  await supabase
    .from('org_subscriptions')
    .upsert({
      org_id: orgId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      created_at: new Date(),
      updated_at: new Date()
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  await supabase
    .from('org_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  await supabase
    .from('org_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date(),
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if ((invoice as any).subscription) {
    // Update subscription status
    await supabase
      .from('org_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', (invoice as any).subscription)
  }

  // Log successful payment
  await supabase
    .from('payment_logs')
    .insert({
      stripe_invoice_id: invoice.id,
      event_type: 'invoice.payment_succeeded',
      amount: invoice.amount_paid,
      currency: invoice.currency,
      created_at: new Date()
    })
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if ((invoice as any).subscription) {
    // Update subscription status
    await supabase
      .from('org_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', (invoice as any).subscription)
  }

  // Log failed payment
  await supabase
    .from('payment_logs')
    .insert({
      stripe_invoice_id: invoice.id,
      event_type: 'invoice.payment_failed',
      amount: invoice.amount_due,
      currency: invoice.currency,
      created_at: new Date()
    })
}