-- Phase 1: Override Tables (Apply Second)
-- This creates the event override system

-- 1. Event Station Overrides
CREATE TABLE event_station_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES model_versions(id),
  station_id text NOT NULL,

  -- Override fields (null = use original)
  display_name_override text,
  activity_override jsonb,
  enabled_override boolean,

  -- Location binding
  lat double precision,
  lng double precision,
  address text,
  media_user_clip_id uuid REFERENCES media_assets(id),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(event_id, station_id)
);

-- 2. Event Mission Overrides
CREATE TABLE event_mission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES model_versions(id),
  mission_id uuid NOT NULL,

  -- Override fields (null = use original)
  title_override text,
  clue_override jsonb,
  overlay_spec_override jsonb,

  -- Rendering status for this specific event
  compiled_video_asset_id uuid REFERENCES media_assets(id),
  compiled_status text NOT NULL DEFAULT 'pending' CHECK (compiled_status IN ('pending','queued','rendering','ready','failed')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(event_id, mission_id)
);

-- Indexes for override tables
CREATE INDEX idx_event_station_overrides_event ON event_station_overrides(event_id);
CREATE INDEX idx_event_station_overrides_version ON event_station_overrides(version_id);
CREATE INDEX idx_event_mission_overrides_event ON event_mission_overrides(event_id);
CREATE INDEX idx_event_mission_overrides_version ON event_mission_overrides(version_id);
CREATE INDEX idx_event_mission_overrides_status ON event_mission_overrides(compiled_status);

-- Enable RLS
ALTER TABLE event_station_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_mission_overrides ENABLE ROW LEVEL SECURITY;