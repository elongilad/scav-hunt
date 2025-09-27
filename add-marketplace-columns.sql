-- Add marketplace columns to hunt_models table
ALTER TABLE hunt_models
ADD COLUMN IF NOT EXISTS published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS duration_min int,
ADD COLUMN IF NOT EXISTS age_min int,
ADD COLUMN IF NOT EXISTS age_max int,
ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Create event_entitlements table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  model_id uuid NOT NULL,
  event_id uuid UNIQUE,
  stripe_customer_id text,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','refunded','canceled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create model_prices table if it doesn't exist
CREATE TABLE IF NOT EXISTS model_prices (
  model_id uuid PRIMARY KEY,
  stripe_price_id text NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_entitlements_org_id_model_id ON event_entitlements(org_id, model_id);
CREATE INDEX IF NOT EXISTS idx_event_entitlements_event_id ON event_entitlements(event_id);
CREATE INDEX IF NOT EXISTS idx_model_prices_model_id ON model_prices(model_id);

-- Add RLS policies
ALTER TABLE event_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_prices ENABLE ROW LEVEL SECURITY;

-- Anyone can read published models
DROP POLICY IF EXISTS "Anyone can read published models" ON hunt_models;
CREATE POLICY "Anyone can read published models" ON hunt_models
  FOR SELECT
  TO authenticated
  USING (published = true);

-- Only owner can write hunt models
DROP POLICY IF EXISTS "Only owner can write hunt models" ON hunt_models;
CREATE POLICY "Only owner can write hunt models" ON hunt_models
  FOR ALL USING (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  ) WITH CHECK (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  );

-- Policies for model_prices
DROP POLICY IF EXISTS "Anyone can read model prices" ON model_prices;
CREATE POLICY "Anyone can read model prices" ON model_prices
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only owner can manage model prices" ON model_prices;
CREATE POLICY "Only owner can manage model prices" ON model_prices
  FOR ALL USING (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  ) WITH CHECK (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  );

-- Policies for event_entitlements
DROP POLICY IF EXISTS "Users can view entitlements for their events" ON event_entitlements;
CREATE POLICY "Users can view entitlements for their events" ON event_entitlements
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE buyer_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Only system can manage entitlements" ON event_entitlements;
CREATE POLICY "Only system can manage entitlements" ON event_entitlements
  FOR ALL USING (false);