-- Create stations table
CREATE TABLE stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  routes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, for production)
-- ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access during game sessions
-- CREATE POLICY "Allow public read access" ON stations
--   FOR SELECT USING (true);

-- Insert sample data
INSERT INTO stations (id, name, routes) VALUES 
(
  'STATION1',
  'Main Entrance',
  '{
    "RED_TEAM": {
      "nextStation": "STATION3",
      "password": "LION123",
      "nextClue": "Find the garden area",
      "videoUrl": "https://drive.google.com/file/d/1abc123/view"
    },
    "BLUE_TEAM": {
      "nextStation": "STATION2",
      "password": "TIGER456", 
      "nextClue": "Head to the playground",
      "videoUrl": "https://drive.google.com/file/d/1def456/view"
    }
  }'
),
(
  'STATION2',
  'Playground',
  '{
    "BLUE_TEAM": {
      "nextStation": "STATION4",
      "password": "EAGLE789",
      "nextClue": "Look for the tall tower",
      "videoUrl": "https://drive.google.com/file/d/1ghi789/view"
    }
  }'
),
(
  'STATION3',
  'Garden Area',
  '{
    "RED_TEAM": {
      "nextStation": "STATION4",
      "password": "WOLF321",
      "nextClue": "Find the final destination",
      "videoUrl": "https://drive.google.com/file/d/1jkl321/view"
    }
  }'
),
(
  'STATION4',
  'Final Station',
  '{
    "BOTH_TEAMS": {
      "nextStation": "END",
      "password": "VICTORY",
      "nextClue": "Congratulations! You have completed the hunt!",
      "videoUrl": "https://drive.google.com/file/d/1mno654/view"
    }
  }'
);