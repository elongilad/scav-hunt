-- Create a table to track team visits
CREATE TABLE team_visits (
  id SERIAL PRIMARY KEY,
  team_password TEXT NOT NULL,
  station_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true
);

-- Disable RLS for now
ALTER TABLE team_visits DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE team_visits TO anon;
GRANT ALL ON TABLE team_visits TO authenticated;
GRANT ALL ON SEQUENCE team_visits_id_seq TO anon;
GRANT ALL ON SEQUENCE team_visits_id_seq TO authenticated;