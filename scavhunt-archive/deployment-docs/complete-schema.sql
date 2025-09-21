-- Complete Database Schema for Scavenger Hunt Application
-- Run this in Supabase SQL Editor to set up the database

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  routes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_visits table for tracking
CREATE TABLE IF NOT EXISTS team_visits (
  id SERIAL PRIMARY KEY,
  team_password TEXT NOT NULL,
  station_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true
);

-- Disable RLS for now (enable in production if needed)
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_visits DISABLE ROW LEVEL SECURITY;

-- Grant permissions for anonymous and authenticated users
GRANT ALL ON TABLE stations TO anon;
GRANT ALL ON TABLE stations TO authenticated;
GRANT ALL ON TABLE team_visits TO anon;
GRANT ALL ON TABLE team_visits TO authenticated;
GRANT ALL ON SEQUENCE team_visits_id_seq TO anon;
GRANT ALL ON SEQUENCE team_visits_id_seq TO authenticated;

-- Insert sample station data
-- Note: You can modify these stations and routes according to your needs

INSERT INTO stations (id, name, routes) VALUES 
('GameOpen', 'Game Opening Station', '{
  "TEAM_1": {
    "nextStation": "SuperKeizer",
    "password": "1111",
    "nextClue": "Head to the mighty emperor''s domain where legends are born.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id1/view"
  },
  "TEAM_2": {
    "nextStation": "Pizza",
    "password": "2222", 
    "nextClue": "Seek sustenance where cheese meets dough in perfect harmony.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id2/view"
  },
  "TEAM_3": {
    "nextStation": "Park4",
    "password": "3333",
    "nextClue": "Find the fourth sanctuary of green where children play.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id3/view"
  },
  "TEAM_4": {
    "nextStation": "Puzzle",
    "password": "4444",
    "nextClue": "Where minds bend and twist to solve the unsolvable.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id4/view"
  },
  "TEAM_5": {
    "nextStation": "SchoolGate",
    "password": "5555",
    "nextClue": "At the entrance to knowledge, where young minds gather.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id5/view"
  }
}'),

('SuperKeizer', 'Emperor''s Domain', '{
  "TEAM_1": {
    "nextStation": "Puzzle",
    "password": "1111",
    "nextClue": "Your next challenge awaits where riddles and mysteries unfold.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id6/view"
  },
  "TEAM_2": {
    "nextStation": "SchoolGate",
    "password": "2222",
    "nextClue": "Proceed to the gates of learning and wisdom.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id7/view"
  },
  "TEAM_3": {
    "nextStation": "SuperKeizer",
    "password": "3333",
    "nextClue": "Return to where emperors once ruled with might.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id8/view"
  },
  "TEAM_4": {
    "nextStation": "synagogue",
    "password": "4444",
    "nextClue": "Seek the sacred place where prayers echo through time.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id9/view"
  },
  "TEAM_5": {
    "nextStation": "Amos",
    "password": "5555",
    "nextClue": "Find the prophet''s namesake in the urban landscape.",
    "videoUrl": "https://drive.google.com/file/d/1example_video_id10/view"
  }
}'),

('End', 'Mission Complete', '{
  "TEAM_1": {
    "nextStation": "END",
    "password": "1111",
    "nextClue": "Congratulations! You have completed your mission successfully!",
    "videoUrl": "https://drive.google.com/file/d/1example_final_video/view"
  },
  "TEAM_2": {
    "nextStation": "END",
    "password": "2222",
    "nextClue": "Mission accomplished! Your team has proven worthy!",
    "videoUrl": "https://drive.google.com/file/d/1example_final_video/view"
  },
  "TEAM_3": {
    "nextStation": "END",
    "password": "3333",
    "nextClue": "Victory is yours! The mission is complete!",
    "videoUrl": "https://drive.google.com/file/d/1example_final_video/view"
  },
  "TEAM_4": {
    "nextStation": "END",
    "password": "4444",
    "nextClue": "Excellent work! You have reached the end of your journey!",
    "videoUrl": "https://drive.google.com/file/d/1example_final_video/view"
  },
  "TEAM_5": {
    "nextStation": "END",
    "password": "5555",
    "nextClue": "Mission complete! Your dedication has paid off!",
    "videoUrl": "https://drive.google.com/file/d/1example_final_video/view"
  }
}');

-- Additional sample stations (add more as needed)
INSERT INTO stations (id, name, routes) VALUES 
('Pizza', 'Pizza Palace', '{
  "TEAM_2": {
    "nextStation": "Park2",
    "password": "2222",
    "nextClue": "Continue to the second green oasis in the city.",
    "videoUrl": "https://drive.google.com/file/d/1example_pizza_video/view"
  }
}'),

('SchoolGate', 'School Entrance', '{
  "TEAM_5": {
    "nextStation": "Amos",
    "password": "5555",
    "nextClue": "Find the street named after the ancient prophet.",
    "videoUrl": "https://drive.google.com/file/d/1example_school_video/view"
  }
}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_visits_password ON team_visits(team_password);
CREATE INDEX IF NOT EXISTS idx_team_visits_station ON team_visits(station_id);
CREATE INDEX IF NOT EXISTS idx_team_visits_timestamp ON team_visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_stations_id ON stations(id);

-- Create a view for easy team progress monitoring
CREATE OR REPLACE VIEW team_progress AS
SELECT 
  tv.team_password,
  tv.station_id,
  tv.timestamp,
  tv.success,
  s.name as station_name,
  ROW_NUMBER() OVER (PARTITION BY tv.team_password, tv.station_id ORDER BY tv.timestamp DESC) as rn
FROM team_visits tv
LEFT JOIN stations s ON tv.station_id = s.id
WHERE tv.success = true;

-- Grant access to the view
GRANT SELECT ON team_progress TO anon;
GRANT SELECT ON team_progress TO authenticated;

-- Optional: Create a function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats(team_pass TEXT)
RETURNS TABLE(
  total_visits BIGINT,
  successful_visits BIGINT,
  last_visit TIMESTAMP WITH TIME ZONE,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_visits,
    COUNT(*) FILTER (WHERE success = true) as successful_visits,
    MAX(timestamp) as last_visit,
    ROUND(
      (COUNT(*) FILTER (WHERE success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
    ) as completion_rate
  FROM team_visits 
  WHERE team_password = team_pass;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_team_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_team_stats(TEXT) TO authenticated;

-- Success message
SELECT 'Database schema created successfully! You can now use the application.' as status;