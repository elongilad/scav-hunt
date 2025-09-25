-- Phase 1: Core Functions (Apply Fifth)
-- Essential functions for model versioning

-- 1. Content hashing function
CREATE OR REPLACE FUNCTION generate_model_content_hash(
  p_model_id uuid,
  p_stations jsonb,
  p_missions jsonb,
  p_video_scenes jsonb DEFAULT '[]'::jsonb
)
RETURNS text AS $$
DECLARE
  content_string text;
  content_hash text;
BEGIN
  -- Create deterministic content string by sorting all data
  content_string := concat(
    'model_id:', p_model_id::text,
    '|stations:', (
      SELECT string_agg(
        concat(
          'id:', station->>'id',
          '|name:', station->>'display_name',
          '|type:', station->>'type',
          '|activity:', (station->'default_activity')::text
        ),
        '|'
        ORDER BY station->>'id'
      )
      FROM jsonb_array_elements(p_stations) AS station
    ),
    '|missions:', (
      SELECT string_agg(
        concat(
          'id:', mission->>'id',
          '|to_station:', mission->>'to_station_id',
          '|title:', mission->>'title',
          '|clue:', (mission->'clue')::text
        ),
        '|'
        ORDER BY mission->>'id'
      )
      FROM jsonb_array_elements(p_missions) AS mission
    )
  );

  -- Generate SHA-256 hash
  content_hash := encode(digest(content_string, 'sha256'), 'hex');

  RETURN content_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get latest published version for a model
CREATE OR REPLACE FUNCTION get_latest_model_version(model_uuid uuid)
RETURNS uuid AS $$
  SELECT id FROM model_versions
  WHERE model_id = model_uuid
    AND is_published = true
  ORDER BY published_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Helper view for model content
CREATE OR REPLACE VIEW model_content_view AS
SELECT
  mv.id AS version_id,
  mv.model_id,
  mv.version_number,
  mv.content_hash,
  mv.published_at,
  -- Aggregate stations
  COALESCE(
    json_agg(
      json_build_object(
        'id', mvs.station_id,
        'display_name', mvs.display_name,
        'type', mvs.station_type,
        'default_activity', mvs.default_activity,
        'order', mvs.snapshot_order
      ) ORDER BY mvs.snapshot_order
    ) FILTER (WHERE mvs.id IS NOT NULL),
    '[]'::json
  ) AS stations,
  -- Aggregate missions
  COALESCE(
    json_agg(
      json_build_object(
        'id', mvm.mission_id,
        'to_station_id', mvm.to_station_id,
        'title', mvm.title,
        'clue', mvm.clue,
        'video_template_id', mvm.video_template_id,
        'overlay_spec', mvm.overlay_spec,
        'locale', mvm.locale,
        'order', mvm.snapshot_order
      ) ORDER BY mvm.snapshot_order
    ) FILTER (WHERE mvm.id IS NOT NULL),
    '[]'::json
  ) AS missions
FROM model_versions mv
LEFT JOIN mv_stations mvs ON mv.id = mvs.version_id
LEFT JOIN mv_missions mvm ON mv.id = mvm.version_id
GROUP BY mv.id, mv.model_id, mv.version_number, mv.content_hash, mv.published_at;

-- 4. Timestamp trigger function
CREATE OR REPLACE FUNCTION update_override_timestamps()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER event_station_override_timestamps
  BEFORE UPDATE ON event_station_overrides
  FOR EACH ROW EXECUTE FUNCTION update_override_timestamps();

CREATE TRIGGER event_mission_override_timestamps
  BEFORE UPDATE ON event_mission_overrides
  FOR EACH ROW EXECUTE FUNCTION update_override_timestamps();

-- Comments for documentation
COMMENT ON FUNCTION generate_model_content_hash IS 'Generates deterministic SHA-256 hash for model content integrity';
COMMENT ON FUNCTION get_latest_model_version IS 'Returns the latest published version ID for a given model';
COMMENT ON VIEW model_content_view IS 'Aggregated view of complete model content for any version';