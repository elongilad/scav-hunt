import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupMarketplaceSchema() {
  console.log('Setting up marketplace schema...');

  try {
    // Add published column to hunt_models
    console.log('Adding published column to hunt_models...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE hunt_models
        ADD COLUMN IF NOT EXISTS published boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS cover_image_url text,
        ADD COLUMN IF NOT EXISTS estimated_duration integer,
        ADD COLUMN IF NOT EXISTS min_age integer DEFAULT 6,
        ADD COLUMN IF NOT EXISTS max_age integer DEFAULT 12;
      `
    });

    // Create event_entitlements table
    console.log('Creating event_entitlements table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS event_entitlements (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id uuid NOT NULL,
          model_id uuid NOT NULL,
          event_id uuid UNIQUE,
          stripe_customer_id text,
          stripe_checkout_session_id text UNIQUE,
          stripe_payment_intent_id text,
          status text NOT NULL DEFAULT 'active',
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `
    });

    // Create model_prices table
    console.log('Creating model_prices table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS model_prices (
          model_id uuid PRIMARY KEY REFERENCES hunt_models(id) ON DELETE CASCADE,
          stripe_price_id text NOT NULL,
          price_cents integer NOT NULL DEFAULT 2999
        );
      `
    });

    // Create indexes
    console.log('Creating indexes...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_event_entitlements_org_model
        ON event_entitlements (org_id, model_id);

        CREATE INDEX IF NOT EXISTS idx_event_entitlements_event
        ON event_entitlements (event_id);
      `
    });

    console.log('✅ Schema setup complete!');

  } catch (error) {
    console.error('❌ Schema setup failed:', error);
  }
}

setupMarketplaceSchema();