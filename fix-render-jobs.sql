-- Fix render_jobs table to match Phase 1 specification
-- Add missing columns for the new render pipeline

-- Add missing columns to render_jobs table
ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'mission_video' CHECK (job_type IN ('mission_video', 'compilation', 'preview'));

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS mission_override_id uuid REFERENCES event_mission_overrides(id) ON DELETE CASCADE;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS input_spec jsonb DEFAULT '{}'::jsonb;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS output_spec jsonb DEFAULT '{}'::jsonb;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 100;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100);

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS current_stage text;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS stages_total integer;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS stages_completed integer DEFAULT 0;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS worker_id text;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS allocated_at timestamptz;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS max_processing_time_minutes integer DEFAULT 30;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS output_asset_id uuid REFERENCES media_assets(id);

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS output_metadata jsonb;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS error_details jsonb;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS max_retries integer DEFAULT 3;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS queued_at timestamptz;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add missing constraints
ALTER TABLE render_jobs
ADD CONSTRAINT IF NOT EXISTS check_retry_count CHECK (retry_count <= max_retries);

ALTER TABLE render_jobs
ADD CONSTRAINT IF NOT EXISTS check_stages_completed CHECK (stages_completed <= stages_total);

-- Update status column if needed
ALTER TABLE render_jobs
ALTER COLUMN status SET DEFAULT 'pending';

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_render_jobs_priority ON render_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_render_jobs_worker ON render_jobs(worker_id, status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_mission_override ON render_jobs(mission_override_id);

-- Add RLS if not enabled
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policy
DROP POLICY IF EXISTS "Users can view render jobs for their events" ON render_jobs;
CREATE POLICY "Users can view render jobs for their events" ON render_jobs
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) OR
        buyer_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage render jobs for their events" ON render_jobs;
CREATE POLICY "Users can manage render jobs for their events" ON render_jobs
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        ) OR
        buyer_user_id = auth.uid()
    )
  );