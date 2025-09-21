-- Event Station Mappings
-- Maps model stations to real-world locations for specific events
CREATE TABLE event_station_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT NOT NULL, -- References model_stations.station_id
  real_location TEXT NOT NULL,
  coordinates JSONB, -- {lat: number, lng: number}
  setup_notes TEXT,
  qr_generated BOOLEAN DEFAULT FALSE,
  custom_clue TEXT, -- Event-specific clue override
  photos TEXT[], -- Array of file names/paths
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, station_id)
);

-- Event Media
-- Media files (images, videos, audio, documents) for specific events
CREATE TABLE event_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  description TEXT,
  usage_context TEXT, -- 'general', 'station_photo', 'clue_image', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_event_station_mappings_event_id ON event_station_mappings(event_id);
CREATE INDEX idx_event_station_mappings_station_id ON event_station_mappings(station_id);
CREATE INDEX idx_event_media_event_id ON event_media(event_id);
CREATE INDEX idx_event_media_type ON event_media(media_type);
CREATE INDEX idx_event_media_usage ON event_media(usage_context);

-- Row Level Security
ALTER TABLE event_station_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_station_mappings
CREATE POLICY "Users can view their org's event station mappings" ON event_station_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_station_mappings.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org's event station mappings" ON event_station_mappings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_station_mappings.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's event station mappings" ON event_station_mappings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_station_mappings.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org's event station mappings" ON event_station_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_station_mappings.event_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for event_media
CREATE POLICY "Users can view their org's event media" ON event_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_media.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org's event media" ON event_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_media.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's event media" ON event_media
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_media.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org's event media" ON event_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN org_members om ON e.org_id = om.org_id
      WHERE e.id = event_media.event_id
      AND om.user_id = auth.uid()
    )
  );

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_station_mappings_updated_at
  BEFORE UPDATE ON event_station_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_media_updated_at
  BEFORE UPDATE ON event_media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();