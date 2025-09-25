-- Phase 1: Core Tables (Apply First)
-- This creates the fundamental versioning tables

-- 1. Model Versions Table
CREATE TABLE model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES hunt_models(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  content_hash text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid NOT NULL REFERENCES auth.users(id),
  is_published boolean NOT NULL DEFAULT false,
  is_draft boolean NOT NULL DEFAULT true,
  parent_version_id uuid REFERENCES model_versions(id),
  major_version integer NOT NULL DEFAULT 1,
  minor_version integer NOT NULL DEFAULT 0,
  patch_version integer NOT NULL DEFAULT 0,
  version_tag text,
  change_summary text,
  change_details jsonb,
  created_at timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE(model_id, version_number),
  UNIQUE(model_id, version_tag),
  CHECK (version_number > 0),
  CHECK (major_version >= 0),
  CHECK (minor_version >= 0),
  CHECK (patch_version >= 0)
);

-- 2. Model Stations Snapshots
CREATE TABLE mv_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  station_id text NOT NULL,
  display_name text NOT NULL,
  station_type text NOT NULL,
  default_activity jsonb NOT NULL,
  snapshot_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),

  UNIQUE(version_id, station_id)
);

-- 3. Model Missions Snapshots
CREATE TABLE mv_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL,
  to_station_id text NOT NULL,
  title text,
  clue jsonb,
  video_template_id uuid,
  overlay_spec jsonb,
  locale text DEFAULT 'he',
  snapshot_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),

  UNIQUE(version_id, mission_id)
);

-- 4. Model Video Scenes Snapshots
CREATE TABLE mv_video_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  scene_id uuid NOT NULL,
  template_asset_id uuid NOT NULL,
  order_index integer NOT NULL,
  scene_type text NOT NULL CHECK (scene_type IN ('intro','user_clip','overlay','outro')),
  start_ms integer,
  end_ms integer,
  overlay_text jsonb,
  created_at timestamptz DEFAULT now(),

  UNIQUE(version_id, scene_id)
);

-- Basic indexes for core tables
CREATE INDEX idx_model_versions_model_id ON model_versions(model_id);
CREATE INDEX idx_model_versions_published ON model_versions(model_id, is_published, published_at DESC);
CREATE INDEX idx_mv_stations_version_id ON mv_stations(version_id);
CREATE INDEX idx_mv_missions_version_id ON mv_missions(version_id);
CREATE INDEX idx_mv_video_scenes_version_id ON mv_video_scenes(version_id);

-- Enable RLS
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mv_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mv_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mv_video_scenes ENABLE ROW LEVEL SECURITY;