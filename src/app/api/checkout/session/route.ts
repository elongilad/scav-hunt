import { NextRequest, NextResponse } from 'next/server';
import { getUserAndOrg } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const modelId = String(form.get('modelId') || '');

    if (!modelId) {
      return NextResponse.json({ error: 'modelId required' }, { status: 400 });
    }

    const { user, org } = await getUserAndOrg();
    if (!user || !org) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if model exists and get pricing
    const { data: priceMap, error: priceError } = await supabase
      .from('model_prices')
      .select('stripe_price_id')
      .eq('model_id', modelId)
      .single();

    if (priceError || !priceMap) {
      return NextResponse.json({ error: 'Model not for sale' }, { status: 400 });
    }

    // Get model details for display
    const { data: model, error: modelError } = await supabase
      .from('hunt_models')
      .select('id, name, description')
      .eq('id', modelId)
      .eq('published', true)
      .single();

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceMap.stripe_price_id, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/catalog`,
      metadata: {
        modelId,
        orgId: org.id,
        userId: user.id,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}