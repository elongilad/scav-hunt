-- Team Progress Table
-- Tracks detailed progress for each team at each station
CREATE TABLE team_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT NOT NULL, -- References model_stations.station_id
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  score_earned INTEGER DEFAULT 0,
  user_clips TEXT[], -- Array of storage paths to user-uploaded clips
  notes TEXT, -- Additional notes or reason for skipping
  attempt_count INTEGER DEFAULT 0, -- Number of attempts at this station
  hints_used INTEGER DEFAULT 0, -- Number of hints used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, station_id)
);

-- Event Live Status View
-- Provides real-time overview of event progress
CREATE VIEW event_live_status AS
SELECT 
  e.id as event_id,
  e.child_name,
  e.status as event_status,
  COUNT(DISTINCT t.id) as total_teams,
  COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_teams,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_teams,
  COUNT(DISTINCT CASE WHEN t.current_station_id IS NOT NULL THEN t.id END) as teams_at_stations,
  AVG(COALESCE(
    (SELECT COUNT(*) FROM team_progress tp 
     WHERE tp.team_id = t.id AND tp.status = 'completed') * 100.0 / 
    NULLIF((SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = e.model_id), 0),
    0
  )) as average_progress_percentage,
  MAX(t.score) as highest_score,
  AVG(t.score) as average_score
FROM events e
LEFT JOIN teams t ON e.id = t.event_id
GROUP BY e.id, e.child_name, e.status, e.model_id;

-- Station Utilization View
-- Shows current team distribution across stations
CREATE VIEW station_utilization AS
SELECT 
  e.id as event_id,
  ms.station_id,
  ms.display_name,
  ms.station_type,
  COUNT(t.id) as teams_currently_here,
  COUNT(tp_completed.id) as total_completions,
  AVG(EXTRACT(EPOCH FROM (tp_completed.completion_time - tp_completed.start_time)) / 60.0) as avg_completion_time_minutes
FROM events e
JOIN model_stations ms ON e.model_id = ms.model_id
LEFT JOIN teams t ON e.id = t.event_id AND t.current_station_id = ms.station_id
LEFT JOIN team_progress tp_completed ON ms.station_id = tp_completed.station_id 
  AND tp_completed.status = 'completed'
  AND tp_completed.team_id IN (SELECT id FROM teams WHERE event_id = e.id)
GROUP BY e.id, ms.station_id, ms.display_name, ms.station_type
ORDER BY ms.station_id;

-- Team Leaderboard View
-- Provides ranked team performance data
CREATE VIEW team_leaderboard AS
SELECT 
  t.id,
  t.event_id,
  t.name,
  t.status,
  t.score,
  t.completion_time,
  COUNT(CASE WHEN tp.status = 'completed' THEN 1 END) as stations_completed,
  COUNT(ms.id) as total_stations,
  ROUND(
    COUNT(CASE WHEN tp.status = 'completed' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(ms.id), 0), 
    1
  ) as completion_percentage,
  EXTRACT(EPOCH FROM (
    COALESCE(t.completion_time, NOW()) - t.created_at
  )) / 60.0 as total_time_minutes,
  ROW_NUMBER() OVER (
    PARTITION BY t.event_id 
    ORDER BY 
      CASE WHEN t.status = 'completed' THEN 0 ELSE 1 END,
      t.score DESC,
      t.completion_time ASC NULLS LAST
  ) as rank
FROM teams t
JOIN events e ON t.event_id = e.id
JOIN model_stations ms ON e.model_id = ms.model_id
LEFT JOIN team_progress tp ON t.id = tp.team_id AND ms.station_id = tp.station_id
GROUP BY t.id, t.event_id, t.name, t.status, t.score, t.completion_time, t.created_at
ORDER BY t.event_id, rank;

-- Indexes for performance
CREATE INDEX idx_team_progress_team_id ON team_progress(team_id);
CREATE INDEX idx_team_progress_station_id ON team_progress(station_id);
CREATE INDEX idx_team_progress_status ON team_progress(status);
CREATE INDEX idx_team_progress_completion_time ON team_progress(completion_time);
CREATE INDEX idx_team_progress_composite ON team_progress(team_id, station_id, status);

-- Row Level Security
ALTER TABLE team_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_progress
CREATE POLICY "Users can view their org's team progress" ON team_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN events e ON t.event_id = e.id
      JOIN org_members om ON e.org_id = om.org_id
      WHERE t.id = team_progress.team_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's team progress" ON team_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN events e ON t.event_id = e.id
      JOIN org_members om ON e.org_id = om.org_id
      WHERE t.id = team_progress.team_id
      AND om.user_id = auth.uid()
    )
  );

-- Update trigger
CREATE TRIGGER update_team_progress_updated_at
  BEFORE UPDATE ON team_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate optimal next station
CREATE OR REPLACE FUNCTION get_optimal_next_station(team_id_param UUID)
RETURNS TABLE(
  station_id TEXT,
  display_name TEXT,
  station_type TEXT,
  difficulty_level INTEGER,
  has_active_mission BOOLEAN
) AS $$
DECLARE
  team_event_id UUID;
  team_model_id UUID;
BEGIN
  -- Get team's event and model
  SELECT e.id, e.model_id INTO team_event_id, team_model_id
  FROM teams t
  JOIN events e ON t.event_id = e.id
  WHERE t.id = team_id_param;
  
  IF team_model_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return available stations (not completed by this team)
  RETURN QUERY
  SELECT 
    ms.station_id,
    ms.display_name,
    ms.station_type,
    ms.difficulty_level,
    EXISTS(
      SELECT 1 FROM model_missions mm 
      WHERE mm.model_id = team_model_id 
      AND mm.to_station_id = ms.station_id 
      AND mm.active = true
    ) as has_active_mission
  FROM model_stations ms
  WHERE ms.model_id = team_model_id
  AND NOT EXISTS (
    SELECT 1 FROM team_progress tp 
    WHERE tp.team_id = team_id_param 
    AND tp.station_id = ms.station_id 
    AND tp.status = 'completed'
  )
  ORDER BY 
    -- Prefer stations with active missions
    has_active_mission DESC,
    -- Then by difficulty level
    ms.difficulty_level ASC,
    -- Then by station order
    ms.station_id ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update team progress and handle completion
CREATE OR REPLACE FUNCTION complete_station_progress(
  team_id_param UUID,
  station_id_param TEXT,
  score_earned_param INTEGER DEFAULT 0,
  user_clips_param TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  hunt_completed BOOLEAN,
  total_score INTEGER,
  completion_percentage NUMERIC
) AS $$
DECLARE
  total_stations INTEGER;
  completed_stations INTEGER;
  team_total_score INTEGER;
  is_hunt_complete BOOLEAN;
BEGIN
  -- Update or insert progress record
  INSERT INTO team_progress (
    team_id, station_id, status, completion_time, 
    score_earned, user_clips, notes
  )
  VALUES (
    team_id_param, station_id_param, 'completed', NOW(),
    score_earned_param, user_clips_param, notes_param
  )
  ON CONFLICT (team_id, station_id)
  DO UPDATE SET
    status = 'completed',
    completion_time = NOW(),
    score_earned = score_earned_param,
    user_clips = user_clips_param,
    notes = notes_param,
    updated_at = NOW();

  -- Calculate totals
  SELECT 
    COUNT(ms.id),
    COUNT(CASE WHEN tp.status = 'completed' THEN 1 END),
    COALESCE(SUM(CASE WHEN tp.status = 'completed' THEN tp.score_earned ELSE 0 END), 0)
  INTO total_stations, completed_stations, team_total_score
  FROM teams t
  JOIN events e ON t.event_id = e.id
  JOIN model_stations ms ON e.model_id = ms.model_id
  LEFT JOIN team_progress tp ON t.id = tp.team_id AND ms.station_id = tp.station_id
  WHERE t.id = team_id_param
  GROUP BY t.id;

  -- Update team's total score
  UPDATE teams 
  SET score = team_total_score, updated_at = NOW()
  WHERE id = team_id_param;

  -- Check if hunt is completed
  is_hunt_complete := (completed_stations >= total_stations);
  
  IF is_hunt_complete THEN
    UPDATE teams 
    SET status = 'completed', completion_time = NOW(), updated_at = NOW()
    WHERE id = team_id_param;
  END IF;

  RETURN QUERY SELECT 
    is_hunt_complete,
    team_total_score,
    ROUND((completed_stations::NUMERIC / NULLIF(total_stations, 0)) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get event statistics
CREATE OR REPLACE FUNCTION get_event_statistics(event_id_param UUID)
RETURNS TABLE(
  total_teams INTEGER,
  active_teams INTEGER,
  completed_teams INTEGER,
  average_progress NUMERIC,
  teams_at_stations INTEGER,
  total_score_earned BIGINT,
  average_completion_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(t.id)::INTEGER as total_teams,
    COUNT(CASE WHEN t.status = 'active' THEN 1 END)::INTEGER as active_teams,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::INTEGER as completed_teams,
    ROUND(AVG(
      COALESCE(
        (SELECT COUNT(*) FROM team_progress tp 
         WHERE tp.team_id = t.id AND tp.status = 'completed') * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM model_stations ms 
                JOIN events e2 ON ms.model_id = e2.model_id 
                WHERE e2.id = event_id_param), 0),
        0
      )
    ), 1) as average_progress,
    COUNT(CASE WHEN t.current_station_id IS NOT NULL THEN 1 END)::INTEGER as teams_at_stations,
    COALESCE(SUM(t.score), 0) as total_score_earned,
    ROUND(AVG(
      CASE WHEN t.completion_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (t.completion_time - t.created_at)) / 60.0 
      END
    ), 1) as average_completion_time_minutes
  FROM teams t
  WHERE t.event_id = event_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE team_progress IS 'Detailed progress tracking for teams at each station';
COMMENT ON VIEW event_live_status IS 'Real-time event overview for live monitoring';
COMMENT ON VIEW station_utilization IS 'Current team distribution and station analytics';
COMMENT ON VIEW team_leaderboard IS 'Ranked team performance with completion metrics';