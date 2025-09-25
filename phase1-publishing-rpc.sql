-- Phase 1: Publishing RPC Functions for Immutable Model Versioning
-- Handles creation of immutable snapshots with content hashing and validation

-- ============================================================================
-- 1. Content Hashing Function
-- ============================================================================

-- Generate deterministic content hash for model version
create or replace function generate_model_content_hash(
  p_model_id uuid,
  p_stations jsonb,
  p_missions jsonb,
  p_video_scenes jsonb default '[]'::jsonb
)
returns text as $$
declare
  content_string text;
  content_hash text;
begin
  -- Create deterministic content string by sorting all data
  content_string := concat(
    'model_id:', p_model_id::text,
    '|stations:', (
      select string_agg(
        concat(
          'id:', station->>'id',
          '|name:', station->>'display_name',
          '|type:', station->>'type',
          '|activity:', (station->'default_activity')::text
        ),
        '|'
        order by station->>'id'
      )
      from jsonb_array_elements(p_stations) as station
    ),
    '|missions:', (
      select string_agg(
        concat(
          'id:', mission->>'id',
          '|to_station:', mission->>'to_station_id',
          '|title:', mission->>'title',
          '|clue:', (mission->'clue')::text,
          '|template:', mission->>'video_template_id',
          '|overlay:', (mission->'overlay_spec')::text,
          '|locale:', mission->>'locale'
        ),
        '|'
        order by mission->>'id'
      )
      from jsonb_array_elements(p_missions) as mission
    ),
    '|video_scenes:', (
      select string_agg(
        concat(
          'id:', scene->>'id',
          '|template:', scene->>'template_asset_id',
          '|order:', scene->>'order_index',
          '|type:', scene->>'scene_type',
          '|start:', scene->>'start_ms',
          '|end:', scene->>'end_ms',
          '|overlay:', (scene->'overlay_text')::text
        ),
        '|'
        order by scene->>'id'
      )
      from jsonb_array_elements(p_video_scenes) as scene
    )
  );

  -- Generate SHA-256 hash
  content_hash := encode(digest(content_string, 'sha256'), 'hex');

  return content_hash;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 2. Model Validation Functions
-- ============================================================================

-- Validate model structure before publishing
create or replace function validate_model_structure(
  p_model_id uuid,
  p_stations jsonb,
  p_missions jsonb
)
returns jsonb as $$
declare
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  station jsonb;
  mission jsonb;
  station_ids text[];
  referenced_stations text[];
  error_messages text[] := array[]::text[];
begin
  -- Extract station IDs
  select array_agg(station_elem->>'id')
  into station_ids
  from jsonb_array_elements(p_stations) as station_elem;

  -- Extract referenced station IDs from missions
  select array_agg(mission_elem->>'to_station_id')
  into referenced_stations
  from jsonb_array_elements(p_missions) as mission_elem;

  -- Validate station IDs are unique
  if array_length(station_ids, 1) != (
    select count(distinct station_elem->>'id')
    from jsonb_array_elements(p_stations) as station_elem
  ) then
    error_messages := array_append(error_messages, 'Duplicate station IDs found');
  end if;

  -- Validate all mission destinations reference existing stations
  for mission in select * from jsonb_array_elements(p_missions)
  loop
    if not (mission->>'to_station_id' = any(station_ids)) then
      error_messages := array_append(
        error_messages,
        format('Mission "%s" references non-existent station "%s"',
               mission->>'title', mission->>'to_station_id')
      );
    end if;
  end loop;

  -- Validate required fields in stations
  for station in select * from jsonb_array_elements(p_stations)
  loop
    if station->>'id' is null or station->>'display_name' is null then
      error_messages := array_append(
        error_messages,
        format('Station missing required fields: %s', station::text)
      );
    end if;
  end loop;

  -- Validate required fields in missions
  for mission in select * from jsonb_array_elements(p_missions)
  loop
    if mission->>'to_station_id' is null then
      error_messages := array_append(
        error_messages,
        format('Mission missing to_station_id: %s', mission::text)
      );
    end if;
  end loop;

  -- Build result
  if array_length(error_messages, 1) > 0 then
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(error_messages)
    );
  end if;

  return validation_result;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 3. Main Publishing Function
-- ============================================================================

-- Publish a new immutable version of a hunt model
create or replace function publish_model_version(
  p_model_id uuid,
  p_version_tag text default null,
  p_change_summary text default null,
  p_change_details jsonb default null,
  p_is_major_version boolean default false,
  p_is_minor_version boolean default false
)
returns jsonb as $$
declare
  model_record record;
  current_version record;
  new_version_number integer;
  new_major integer;
  new_minor integer;
  new_patch integer;
  stations_data jsonb;
  missions_data jsonb;
  video_scenes_data jsonb;
  content_hash text;
  validation_result jsonb;
  new_version_id uuid;
  station_record record;
  mission_record record;
  scene_record record;
  station_order integer := 1;
  mission_order integer := 1;
  result jsonb;
begin
  -- Verify model exists and user has permission
  select * into model_record
  from hunt_models hm
  where hm.id = p_model_id
    and hm.org_id in (
      select org_id from org_members
      where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
    );

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Model not found or insufficient permissions'
    );
  end if;

  -- Get current latest version for versioning
  select * into current_version
  from model_versions
  where model_id = p_model_id
  order by version_number desc
  limit 1;

  -- Calculate new version numbers
  if current_version is null then
    -- First version
    new_version_number := 1;
    new_major := 1;
    new_minor := 0;
    new_patch := 0;
  else
    new_version_number := current_version.version_number + 1;

    if p_is_major_version then
      new_major := current_version.major_version + 1;
      new_minor := 0;
      new_patch := 0;
    elsif p_is_minor_version then
      new_major := current_version.major_version;
      new_minor := current_version.minor_version + 1;
      new_patch := 0;
    else
      new_major := current_version.major_version;
      new_minor := current_version.minor_version;
      new_patch := current_version.patch_version + 1;
    end if;
  end if;

  -- Collect current model data
  -- Get stations
  select jsonb_agg(
    jsonb_build_object(
      'id', ms.id,
      'display_name', ms.display_name,
      'type', ms.type,
      'default_activity', ms.default_activity
    ) order by ms.created_at
  ) into stations_data
  from model_stations ms
  where ms.model_id = p_model_id;

  -- Get missions
  select jsonb_agg(
    jsonb_build_object(
      'id', mm.id,
      'to_station_id', mm.to_station_id,
      'title', mm.title,
      'clue', mm.clue,
      'video_template_id', mm.video_template_id,
      'overlay_spec', mm.overlay_spec,
      'locale', mm.locale
    ) order by mm.created_at
  ) into missions_data
  from model_missions mm
  where mm.model_id = p_model_id;

  -- Get video scenes (related to missions)
  select jsonb_agg(
    jsonb_build_object(
      'id', vts.id,
      'template_asset_id', vts.template_asset_id,
      'order_index', vts.order_index,
      'scene_type', vts.scene_type,
      'start_ms', vts.start_ms,
      'end_ms', vts.end_ms,
      'overlay_text', vts.overlay_text
    ) order by vts.template_asset_id, vts.order_index
  ) into video_scenes_data
  from video_template_scenes vts
  where vts.template_asset_id in (
    select mm.video_template_id
    from model_missions mm
    where mm.model_id = p_model_id and mm.video_template_id is not null
  );

  -- Set defaults for null data
  stations_data := coalesce(stations_data, '[]'::jsonb);
  missions_data := coalesce(missions_data, '[]'::jsonb);
  video_scenes_data := coalesce(video_scenes_data, '[]'::jsonb);

  -- Validate model structure
  validation_result := validate_model_structure(p_model_id, stations_data, missions_data);

  if not (validation_result->>'valid')::boolean then
    return jsonb_build_object(
      'success', false,
      'error', 'Model validation failed',
      'validation_errors', validation_result->'errors'
    );
  end if;

  -- Generate content hash
  content_hash := generate_model_content_hash(
    p_model_id,
    stations_data,
    missions_data,
    video_scenes_data
  );

  -- Check if content has actually changed
  if current_version is not null and current_version.content_hash = content_hash then
    return jsonb_build_object(
      'success', false,
      'error', 'No changes detected since last version',
      'current_version_id', current_version.id
    );
  end if;

  -- Create new version record
  insert into model_versions (
    model_id,
    version_number,
    content_hash,
    published_by,
    is_published,
    is_draft,
    parent_version_id,
    major_version,
    minor_version,
    patch_version,
    version_tag,
    change_summary,
    change_details
  ) values (
    p_model_id,
    new_version_number,
    content_hash,
    auth.uid(),
    true,
    false,
    case when current_version is not null then current_version.id else null end,
    new_major,
    new_minor,
    new_patch,
    p_version_tag,
    p_change_summary,
    p_change_details
  ) returning id into new_version_id;

  -- Create station snapshots
  for station_record in
    select * from jsonb_to_recordset(stations_data) as x(
      id text,
      display_name text,
      type text,
      default_activity jsonb
    )
  loop
    insert into mv_stations (
      version_id,
      station_id,
      display_name,
      station_type,
      default_activity,
      snapshot_order
    ) values (
      new_version_id,
      station_record.id,
      station_record.display_name,
      station_record.type,
      station_record.default_activity,
      station_order
    );

    station_order := station_order + 1;
  end loop;

  -- Create mission snapshots
  for mission_record in
    select * from jsonb_to_recordset(missions_data) as x(
      id uuid,
      to_station_id text,
      title text,
      clue jsonb,
      video_template_id uuid,
      overlay_spec jsonb,
      locale text
    )
  loop
    insert into mv_missions (
      version_id,
      mission_id,
      to_station_id,
      title,
      clue,
      video_template_id,
      overlay_spec,
      locale,
      snapshot_order
    ) values (
      new_version_id,
      mission_record.id,
      mission_record.to_station_id,
      mission_record.title,
      mission_record.clue,
      mission_record.video_template_id,
      mission_record.overlay_spec,
      mission_record.locale,
      mission_order
    );

    mission_order := mission_order + 1;
  end loop;

  -- Create video scene snapshots
  for scene_record in
    select * from jsonb_to_recordset(video_scenes_data) as x(
      id uuid,
      template_asset_id uuid,
      order_index integer,
      scene_type text,
      start_ms integer,
      end_ms integer,
      overlay_text jsonb
    )
  loop
    insert into mv_video_scenes (
      version_id,
      scene_id,
      template_asset_id,
      order_index,
      scene_type,
      start_ms,
      end_ms,
      overlay_text
    ) values (
      new_version_id,
      scene_record.id,
      scene_record.template_asset_id,
      scene_record.order_index,
      scene_record.scene_type,
      scene_record.start_ms,
      scene_record.end_ms,
      scene_record.overlay_text
    );
  end loop;

  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'version_id', new_version_id,
    'version_number', new_version_number,
    'semantic_version', format('%s.%s.%s', new_major, new_minor, new_patch),
    'content_hash', content_hash,
    'stations_count', jsonb_array_length(stations_data),
    'missions_count', jsonb_array_length(missions_data),
    'video_scenes_count', jsonb_array_length(video_scenes_data),
    'change_summary', p_change_summary
  );

  return result;

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', 'Publishing failed',
      'error_detail', SQLERRM
    );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 4. Version Management Functions
-- ============================================================================

-- Get version history for a model
create or replace function get_model_version_history(p_model_id uuid)
returns table(
  version_id uuid,
  version_number integer,
  semantic_version text,
  content_hash text,
  published_at timestamptz,
  published_by_email text,
  is_published boolean,
  version_tag text,
  change_summary text,
  stations_count bigint,
  missions_count bigint
) as $$
begin
  return query
  select
    mv.id,
    mv.version_number,
    format('%s.%s.%s', mv.major_version, mv.minor_version, mv.patch_version),
    mv.content_hash,
    mv.published_at,
    au.email,
    mv.is_published,
    mv.version_tag,
    mv.change_summary,
    (select count(*) from mv_stations where version_id = mv.id),
    (select count(*) from mv_missions where version_id = mv.id)
  from model_versions mv
  left join auth.users au on mv.published_by = au.id
  where mv.model_id = p_model_id
  order by mv.version_number desc;
end;
$$ language plpgsql security definer;

-- Compare two versions
create or replace function compare_model_versions(
  p_version_id_1 uuid,
  p_version_id_2 uuid
)
returns jsonb as $$
declare
  version_1_content jsonb;
  version_2_content jsonb;
  comparison_result jsonb;
begin
  -- Get content for both versions
  select row_to_json(mcv.*)::jsonb into version_1_content
  from model_content_view mcv
  where mcv.version_id = p_version_id_1;

  select row_to_json(mcv.*)::jsonb into version_2_content
  from model_content_view mcv
  where mcv.version_id = p_version_id_2;

  if version_1_content is null or version_2_content is null then
    return jsonb_build_object(
      'error', 'One or both versions not found'
    );
  end if;

  -- Build comparison result
  comparison_result := jsonb_build_object(
    'version_1', jsonb_build_object(
      'version_id', p_version_id_1,
      'version_number', version_1_content->'version_number',
      'content_hash', version_1_content->'content_hash',
      'published_at', version_1_content->'published_at'
    ),
    'version_2', jsonb_build_object(
      'version_id', p_version_id_2,
      'version_number', version_2_content->'version_number',
      'content_hash', version_2_content->'content_hash',
      'published_at', version_2_content->'published_at'
    ),
    'are_identical', (version_1_content->'content_hash' = version_2_content->'content_hash'),
    'stations_diff', jsonb_build_object(
      'version_1_count', jsonb_array_length(version_1_content->'stations'),
      'version_2_count', jsonb_array_length(version_2_content->'stations'),
      'changed', (version_1_content->'stations' != version_2_content->'stations')
    ),
    'missions_diff', jsonb_build_object(
      'version_1_count', jsonb_array_length(version_1_content->'missions'),
      'version_2_count', jsonb_array_length(version_2_content->'missions'),
      'changed', (version_1_content->'missions' != version_2_content->'missions')
    )
  );

  return comparison_result;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 5. Event Initialization Functions
-- ============================================================================

-- Initialize event with a specific model version
create or replace function initialize_event_from_version(
  p_event_id uuid,
  p_version_id uuid
)
returns jsonb as $$
declare
  version_record record;
  event_record record;
  station_record record;
  mission_record record;
  result_overrides_created integer := 0;
  result_nodes_created integer := 0;
  result_edges_created integer := 0;
begin
  -- Verify version exists
  select * into version_record
  from model_versions mv
  where mv.id = p_version_id
    and mv.is_published = true;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Version not found or not published'
    );
  end if;

  -- Verify event exists and user has permission
  select * into event_record
  from events e
  where e.id = p_event_id
    and (
      e.org_id in (
        select org_id from org_members
        where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
      ) or
      e.buyer_user_id = auth.uid()
    );

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Event not found or insufficient permissions'
    );
  end if;

  -- Create station overrides (initially empty - pure inheritance)
  for station_record in
    select * from mv_stations
    where version_id = p_version_id
    order by snapshot_order
  loop
    insert into event_station_overrides (
      event_id,
      version_id,
      station_id
    ) values (
      p_event_id,
      p_version_id,
      station_record.station_id
    );

    result_overrides_created := result_overrides_created + 1;
  end loop;

  -- Create mission overrides (initially empty - pure inheritance)
  for mission_record in
    select * from mv_missions
    where version_id = p_version_id
    order by snapshot_order
  loop
    insert into event_mission_overrides (
      event_id,
      version_id,
      mission_id
    ) values (
      p_event_id,
      p_version_id,
      mission_record.mission_id
    );
  end loop;

  -- Create basic graph nodes for stations
  for station_record in
    select * from mv_stations
    where version_id = p_version_id
    order by snapshot_order
  loop
    insert into event_graph_nodes (
      event_id,
      version_id,
      node_type,
      node_ref_id,
      node_label,
      node_order
    ) values (
      p_event_id,
      p_version_id,
      'station',
      station_record.station_id,
      station_record.display_name,
      station_record.snapshot_order
    );

    result_nodes_created := result_nodes_created + 1;
  end loop;

  -- Create basic graph nodes for missions
  for mission_record in
    select * from mv_missions
    where version_id = p_version_id
    order by snapshot_order
  loop
    insert into event_graph_nodes (
      event_id,
      version_id,
      node_type,
      node_ref_id,
      node_label,
      node_order
    ) values (
      p_event_id,
      p_version_id,
      'mission',
      mission_record.mission_id::text,
      coalesce(mission_record.title, 'Mission'),
      mission_record.snapshot_order + 1000 -- Offset to separate from stations
    );

    result_nodes_created := result_nodes_created + 1;
  end loop;

  -- Create basic graph edges (mission -> target station)
  insert into event_graph_edges (
    event_id,
    version_id,
    from_node_id,
    to_node_id,
    edge_type,
    edge_label
  )
  select
    p_event_id,
    p_version_id,
    mission_node.id,
    station_node.id,
    'normal',
    'leads_to'
  from mv_missions mm
  join event_graph_nodes mission_node on (
    mission_node.event_id = p_event_id and
    mission_node.node_type = 'mission' and
    mission_node.node_ref_id = mm.mission_id::text
  )
  join event_graph_nodes station_node on (
    station_node.event_id = p_event_id and
    station_node.node_type = 'station' and
    station_node.node_ref_id = mm.to_station_id
  )
  where mm.version_id = p_version_id;

  get diagnostics result_edges_created = row_count;

  -- Update event to reference this version
  update events
  set model_id = version_record.model_id
  where id = p_event_id;

  return jsonb_build_object(
    'success', true,
    'version_id', p_version_id,
    'event_id', p_event_id,
    'overrides_created', result_overrides_created,
    'graph_nodes_created', result_nodes_created,
    'graph_edges_created', result_edges_created
  );

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', 'Event initialization failed',
      'error_detail', SQLERRM
    );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 6. Comments and Documentation
-- ============================================================================

comment on function generate_model_content_hash is 'Generates deterministic SHA-256 hash for model content integrity';
comment on function validate_model_structure is 'Validates model structure before publishing to prevent broken versions';
comment on function publish_model_version is 'Main function to create immutable model version snapshots';
comment on function get_model_version_history is 'Returns complete version history for a model';
comment on function compare_model_versions is 'Compares two model versions and returns differences';
comment on function initialize_event_from_version is 'Sets up event with overrides and graph from specific model version';