-- Stripe Integration Schema
-- Tables for managing subscriptions, payments, and billing

-- Organization Subscriptions
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL, -- 'free', 'basic', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'incomplete'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_plan_id CHECK (plan_id IN ('free', 'basic', 'pro', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid', 'canceling'))
);

-- Event Payments (pay-per-event)
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'ILS',
  pricing_tier TEXT NOT NULL, -- 'event-small', 'event-medium', 'event-large'
  participant_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_pricing_tier CHECK (pricing_tier IN ('event-small', 'event-medium', 'event-large')),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Payment Logs (for audit and debugging)
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  event_type TEXT NOT NULL, -- webhook event type
  amount INTEGER, -- Amount in cents
  currency TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'events_created', 'participants_added', 'video_storage', 'api_calls'
  metric_value INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('events_created', 'participants_added', 'video_storage_mb', 'api_calls', 'export_downloads'))
);

-- Promotional Codes/Coupons
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  stripe_coupon_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value INTEGER NOT NULL, -- Percentage (1-100) or fixed amount in cents
  currency TEXT DEFAULT 'ILS',
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applicable_plans TEXT[] DEFAULT '{}', -- Empty array means all plans
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed')),
  CONSTRAINT valid_percentage CHECK (
    (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100) OR 
    discount_type = 'fixed'
  )
);

-- Promo Code Usage
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  discount_amount INTEGER NOT NULL, -- Amount discounted in cents
  used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(promo_code_id, org_id) -- Prevent multiple uses by same org
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON org_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_stripe_id ON org_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON org_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_org_id ON event_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_stripe_id ON event_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_status ON event_payments(status);

CREATE INDEX IF NOT EXISTS idx_payment_logs_org_id ON payment_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_id ON usage_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type_period ON usage_metrics(metric_type, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

-- RLS Policies
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view their org subscriptions" ON org_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = org_subscriptions.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage org subscriptions" ON org_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = org_subscriptions.org_id 
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'admin'
    )
  );

-- Payment policies
CREATE POLICY "Users can view their org payments" ON event_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = event_payments.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Payment logs policies (admin only for sensitive data)
CREATE POLICY "Admins can view payment logs" ON payment_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = payment_logs.org_id 
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'admin'
    )
  );

-- Usage metrics policies
CREATE POLICY "Users can view their org usage" ON usage_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = usage_metrics.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Promo codes (public read for validation)
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT USING (is_active = TRUE);

-- Promo code usage
CREATE POLICY "Users can view their promo usage" ON promo_code_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = promo_code_usage.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Functions for usage tracking
CREATE OR REPLACE FUNCTION track_usage_metric(
  org_uuid UUID,
  metric_type_param TEXT,
  metric_value_param INTEGER,
  period_start_param TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  period_end_param TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_metrics (org_id, metric_type, metric_value, period_start, period_end)
  VALUES (org_uuid, metric_type_param, metric_value_param, period_start_param, period_end_param)
  ON CONFLICT (org_id, metric_type, period_start, period_end) 
  DO UPDATE SET 
    metric_value = usage_metrics.metric_value + metric_value_param,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get current plan limits
CREATE OR REPLACE FUNCTION get_org_plan_limits(org_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  subscription_record RECORD;
  plan_limits JSONB;
BEGIN
  -- Get active subscription
  SELECT plan_id INTO subscription_record
  FROM org_subscriptions 
  WHERE org_id = org_uuid AND status = 'active'
  LIMIT 1;
  
  -- Return limits based on plan
  CASE subscription_record.plan_id
    WHEN 'basic' THEN
      plan_limits := '{
        "events_per_month": 10,
        "participants_per_event": 100,
        "video_storage_gb": 10,
        "custom_templates": true
      }'::jsonb;
    WHEN 'pro' THEN
      plan_limits := '{
        "events_per_month": -1,
        "participants_per_event": 500,
        "video_storage_gb": 50,
        "custom_templates": true,
        "custom_branding": true
      }'::jsonb;
    WHEN 'enterprise' THEN
      plan_limits := '{
        "events_per_month": -1,
        "participants_per_event": -1,
        "video_storage_gb": 200,
        "custom_templates": true,
        "custom_branding": true,
        "sso": true
      }'::jsonb;
    ELSE
      -- Free plan
      plan_limits := '{
        "events_per_month": 2,
        "participants_per_event": 20,
        "video_storage_gb": 1,
        "custom_templates": false
      }'::jsonb;
  END CASE;
  
  RETURN plan_limits;
END;
$$ LANGUAGE plpgsql;

-- Function to check if org can create event (within limits)
CREATE OR REPLACE FUNCTION can_create_event(org_uuid UUID, participant_count INTEGER DEFAULT 0)
RETURNS BOOLEAN AS $$
DECLARE
  plan_limits JSONB;
  current_events INTEGER;
  max_events INTEGER;
  max_participants INTEGER;
BEGIN
  -- Get plan limits
  plan_limits := get_org_plan_limits(org_uuid);
  
  max_events := (plan_limits->>'events_per_month')::INTEGER;
  max_participants := (plan_limits->>'participants_per_event')::INTEGER;
  
  -- Check participant limit
  IF max_participants != -1 AND participant_count > max_participants THEN
    RETURN FALSE;
  END IF;
  
  -- Check monthly event limit
  IF max_events != -1 THEN
    SELECT COUNT(*) INTO current_events
    FROM events 
    WHERE org_id = org_uuid 
    AND created_at >= DATE_TRUNC('month', NOW());
    
    IF current_events >= max_events THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;