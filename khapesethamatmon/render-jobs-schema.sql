-- Render Jobs Table
-- Tracks video rendering tasks for team completion videos
CREATE TABLE render_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  video_template_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  user_clips JSONB NOT NULL, -- Array of user clip objects
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  output_path TEXT, -- Path to rendered video in storage
  error_message TEXT,
  render_config JSONB, -- Additional render configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams Table (if not exists)
-- Represents participant teams in events
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  participants JSONB, -- Array of participant names/details
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inactive')),
  current_station_id TEXT, -- Current station in the hunt
  completion_time TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, name)
);

-- User Clips Table
-- Stores video clips uploaded by participants during the hunt
CREATE TABLE user_clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT NOT NULL, -- Which station this clip is from
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  duration_ms INTEGER, -- Duration in milliseconds
  file_size BIGINT, -- File size in bytes
  mime_type TEXT,
  thumbnail_path TEXT, -- Path to generated thumbnail
  upload_metadata JSONB, -- Device info, location, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX(team_id, station_id),
  INDEX(event_id, station_id)
);

-- Indexes for performance
CREATE INDEX idx_render_jobs_event_id ON render_jobs(event_id);
CREATE INDEX idx_render_jobs_team_id ON render_jobs(team_id);
CREATE INDEX idx_render_jobs_status ON render_jobs(status);
CREATE INDEX idx_render_jobs_created_at ON render_jobs(created_at);

CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_status ON teams(status);

CREATE INDEX idx_user_clips_team_id ON user_clips(team_id);
CREATE INDEX idx_user_clips_event_id ON user_clips(event_id);
CREATE INDEX idx_user_clips_station_id ON user_clips(station_id);

-- Row Level Security
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for render_jobs
CREATE POLICY "Users can view their org's render jobs" ON render_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = render_jobs.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org's render jobs" ON render_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = render_jobs.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's render jobs" ON render_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = render_jobs.event_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for teams
CREATE POLICY "Users can view their org's teams" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = teams.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = teams.event_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for user_clips
CREATE POLICY "Users can view their org's user clips" ON user_clips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = user_clips.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Teams can insert their own clips" ON user_clips
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = user_clips.team_id
      AND e.id = user_clips.event_id
      -- Note: This would need team authentication in a real system
    )
  );

-- Update triggers
CREATE TRIGGER update_render_jobs_updated_at
  BEFORE UPDATE ON render_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for render job management
CREATE OR REPLACE FUNCTION get_render_queue_position(job_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) + 1 
    FROM render_jobs 
    WHERE status = 'pending' 
    AND created_at < (
      SELECT created_at 
      FROM render_jobs 
      WHERE id = job_id
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get rendering statistics
CREATE OR REPLACE FUNCTION get_render_stats(org_id_param UUID)
RETURNS TABLE(
  total_jobs BIGINT,
  pending_jobs BIGINT,
  processing_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  avg_processing_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    AVG(
      CASE 
        WHEN status = 'completed' 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 60.0 
        ELSE NULL 
      END
    ) as avg_processing_time_minutes
  FROM render_jobs rj
  JOIN events e ON rj.event_id = e.id
  WHERE e.org_id = org_id_param;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (remove in production)
-- INSERT INTO teams (event_id, name, participants) VALUES 
-- ('your-event-id', 'Team Alpha', '["Alice", "Bob"]'),
-- ('your-event-id', 'Team Beta', '["Charlie", "Diana"]');

COMMENT ON TABLE render_jobs IS 'Video rendering jobs for team completion videos';
COMMENT ON TABLE teams IS 'Participant teams in scavenger hunt events';
COMMENT ON TABLE user_clips IS 'Video clips uploaded by participants during hunts';

COMMENT ON COLUMN render_jobs.user_clips IS 'JSON array of user clip objects with file paths and metadata';
COMMENT ON COLUMN render_jobs.render_config IS 'Additional rendering configuration like quality settings, effects, etc.';
COMMENT ON COLUMN teams.participants IS 'JSON array of participant names and details';
COMMENT ON COLUMN user_clips.upload_metadata IS 'Device info, GPS location, timestamp, etc.';