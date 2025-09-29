import { NextRequest, NextResponse } from 'next/server';
import { getUserAndOrg } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { instantiateEvent } from '@/lib/actions/model-actions';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const modelId = String(form.get('modelId') || '');

    if (!modelId) {
      return NextResponse.json({ error: 'modelId required' }, { status: 400 });
    }

    const { user, org } = await getUserAndOrg();
    if (!user) {
      console.log('❌ Checkout attempted without authentication - redirecting to login');
      // Redirect to login instead of returning JSON error
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
      return NextResponse.redirect(`${baseUrl}/auth/login?redirect=/catalog`, 302);
    }

    // In development, create a temporary org if user doesn't have one
    let finalOrg = org;
    if (!org && process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: User has no org, creating temporary org for checkout');
      const supabase = await createClient();

      // Try to create a temporary organization for the user
      const { data: tempOrg, error: orgError } = await supabase
        .from('orgs')
        .insert({
          name: `${user.email?.split('@')[0] || 'User'}'s Quests`,
          owner_user_id: user.id
        })
        .select()
        .single();

      if (tempOrg && !orgError) {
        // Also create org membership
        await supabase
          .from('org_members')
          .insert({
            org_id: tempOrg.id,
            user_id: user.id,
            role: 'owner'
          });

        finalOrg = tempOrg;
        console.log('✅ Created temporary org for user:', tempOrg.name);
      } else {
        console.error('❌ Failed to create temporary org:', orgError);
        return NextResponse.json({ error: 'Unable to create organization' }, { status: 500 });
      }
    } else if (!org) {
      console.log('❌ User has no organization');
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if we're in development mode or if Stripe is properly configured
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassPayment = isDevelopment || !process.env.STRIPE_SECRET_KEY;

    // If not bypassing payment, check pricing
    let priceMap = null;
    if (!bypassPayment) {
      const { data: priceData, error: priceError } = await supabase
        .from('model_prices')
        .select('stripe_price_id')
        .eq('model_id', modelId)
        .single();

      if (priceError || !priceData) {
        return NextResponse.json({ error: 'Model not for sale' }, { status: 400 });
      }
      priceMap = priceData;
    }

    // Get model details for display (use admin client to bypass RLS)
    console.log('🔍 Looking for model with ID:', modelId);
    const adminSupabase = createAdminClient();
    const { data: model, error: modelError } = await adminSupabase
      .from('hunt_models')
      .select('id, name, description')
      .eq('id', modelId)
      .eq('published', true)
      .single();

    if (modelError || !model) {
      console.error('❌ Model not found:', modelError, 'Model ID:', modelId);

      // Let's also check what models are available
      const { data: allModels } = await adminSupabase
        .from('hunt_models')
        .select('id, name, published')
        .order('name');
      console.log('📋 Available models:', allModels);

      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    console.log('✅ Found model:', model.name);

    if (bypassPayment) {
      // Development/Mock mode: Skip payment and directly create the event
      console.log('🔄 Development mode: Bypassing payment for model', model.name);

      try {
        // Create the event directly using the instantiateEvent function
        const eventResult = await instantiateEvent({
          modelVersionId: modelId, // Using model ID as version ID for marketplace
          title: `${model.name} - Test Quest`, // Default name, can be changed in setup
          locale: 'en'
        });

        if (!eventResult.success) {
          throw new Error(eventResult.error || 'Failed to create event');
        }

        // Create entitlement for the event
        console.log('🎫 Creating entitlement for event:', eventResult.eventId);
        const { error: entitlementError } = await adminSupabase
          .from('event_entitlements')
          .insert({
            event_id: eventResult.eventId,
            org_id: finalOrg.id,
            model_id: modelId,
            status: 'active'
          });

        if (entitlementError) {
          console.error('❌ Failed to create entitlement:', entitlementError);
          // Don't fail the whole process, just log the error
        } else {
          console.log('✅ Entitlement created successfully');
        }

        // Redirect directly to the event prep wizard
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
        const redirectUrl = `${baseUrl}/dashboard/events/${eventResult.eventId}/prep?from=catalog`;
        console.log('✅ Quest created successfully! Redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl, 303);

      } catch (error) {
        console.error('Error creating event in development mode:', error);
        return NextResponse.json({ error: 'Failed to create quest. Please try again.' }, { status: 500 });
      }
    } else {
      // Production mode: Use real Stripe checkout
      if (!priceMap) {
        return NextResponse.json({ error: 'Price information not available' }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceMap.stripe_price_id, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/catalog`,
        metadata: {
          modelId,
          orgId: finalOrg.id,
          userId: user.id,
        },
      });

      if (!session.url) {
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
      }

      return NextResponse.redirect(session.url, 303);
    }
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}