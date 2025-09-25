-- Fix render_jobs table to match Phase 1 specification
-- Add missing columns for the new render pipeline
-- CORRECTED VERSION - Compatible with PostgreSQL constraints

-- Add missing columns to render_jobs table
ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'mission_video';

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS mission_override_id uuid;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS input_spec jsonb DEFAULT '{}'::jsonb;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS output_spec jsonb DEFAULT '{}'::jsonb;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 100;

ALTER TABLE render_jobs
ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0;

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
ADD COLUMN IF NOT EXISTS output_asset_id uuid;

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

-- Add constraints (without IF NOT EXISTS since it's not universally supported)
DO $$
BEGIN
    -- Add job_type check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_jobs_job_type_check') THEN
        ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_job_type_check
        CHECK (job_type IN ('mission_video', 'compilation', 'preview'));
    END IF;

    -- Add progress percentage check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_jobs_progress_check') THEN
        ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_progress_check
        CHECK (progress_percentage BETWEEN 0 AND 100);
    END IF;

    -- Add retry count check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_jobs_retry_check') THEN
        ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_retry_check
        CHECK (retry_count <= max_retries);
    END IF;

    -- Add stages completed check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_jobs_stages_check') THEN
        ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_stages_check
        CHECK (stages_completed <= stages_total);
    END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
    -- Add mission_override_id foreign key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_jobs_mission_override_fkey') THEN
        ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_mission_override_fkey
        FOREIGN KEY (mission_override_id) REFERENCES event_mission_overrides(id) ON DELETE CASCADE;
    END IF;

    -- Add output_asset_id foreign key (only if media_assets table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_jobs_output_asset_fkey') THEN
            ALTER TABLE render_jobs ADD CONSTRAINT render_jobs_output_asset_fkey
            FOREIGN KEY (output_asset_id) REFERENCES media_assets(id);
        END IF;
    END IF;
END $$;

-- Update status column default if needed
ALTER TABLE render_jobs ALTER COLUMN status SET DEFAULT 'pending';

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_render_jobs_priority ON render_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_render_jobs_worker ON render_jobs(worker_id, status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_mission_override ON render_jobs(mission_override_id);

-- Add RLS if not enabled
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies
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