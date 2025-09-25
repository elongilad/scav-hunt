-- Phase 1: Immutable Model Versioning System
-- Architecture overhaul for production-ready scavenger hunt platform

-- ============================================================================
-- 1. Model Versions (Immutable Snapshots)
-- ============================================================================

-- Central versioning table that creates immutable snapshots
create table model_versions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references hunt_models(id) on delete cascade,
  version_number integer not null,
  -- Content hash for integrity verification
  content_hash text not null,
  -- Snapshot metadata
  published_at timestamptz not null default now(),
  published_by uuid not null references auth.users(id),
  -- Version control fields
  is_published boolean not null default false,
  is_draft boolean not null default true,
  parent_version_id uuid references model_versions(id),
  -- Semantic versioning support
  major_version integer not null default 1,
  minor_version integer not null default 0,
  patch_version integer not null default 0,
  version_tag text, -- e.g., "stable", "beta", "release-candidate"
  -- Change tracking
  change_summary text,
  change_details jsonb,
  created_at timestamptz default now(),

  -- Ensure unique version numbers per model
  unique(model_id, version_number),
  -- Ensure version tag uniqueness per model (when not null)
  unique(model_id, version_tag),
  -- Check constraints
  check (version_number > 0),
  check (major_version >= 0),
  check (minor_version >= 0),
  check (patch_version >= 0)
);

-- ============================================================================
-- 2. Snapshot Tables (mv_* prefix for immutable copies)
-- ============================================================================

-- Immutable snapshots of model stations
create table mv_stations (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references model_versions(id) on delete cascade,
  -- Original station data (immutable snapshot)
  station_id text not null, -- Original model_stations.id
  display_name text not null,
  station_type text not null,
  default_activity jsonb not null,
  -- Snapshot metadata
  snapshot_order integer not null, -- Order within this version
  created_at timestamptz default now(),

  -- Ensure unique station_id per version
  unique(version_id, station_id)
);

-- Immutable snapshots of model missions
create table mv_missions (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references model_versions(id) on delete cascade,
  -- Original mission data (immutable snapshot)
  mission_id uuid not null, -- Original model_missions.id
  to_station_id text not null, -- References mv_stations.station_id
  title text,
  clue jsonb,
  video_template_id uuid, -- References original media_assets.id
  overlay_spec jsonb,
  locale text default 'he',
  -- Snapshot metadata
  snapshot_order integer not null,
  created_at timestamptz default now(),

  -- Ensure unique mission_id per version
  unique(version_id, mission_id),
  -- Foreign key to ensure to_station_id exists in same version
  foreign key (version_id, to_station_id) references mv_stations(version_id, station_id)
);

-- Immutable snapshots of video template scenes
create table mv_video_scenes (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references model_versions(id) on delete cascade,
  -- Original scene data (immutable snapshot)
  scene_id uuid not null, -- Original video_template_scenes.id
  template_asset_id uuid not null, -- References original media_assets.id
  order_index integer not null,
  scene_type text not null check (scene_type in ('intro','user_clip','overlay','outro')),
  start_ms integer,
  end_ms integer,
  overlay_text jsonb,
  -- Snapshot metadata
  created_at timestamptz default now(),

  -- Ensure unique scene_id per version
  unique(version_id, scene_id)
);

-- ============================================================================
-- 3. Event Override System (Override-only customization)
-- ============================================================================

-- Event-specific station overrides (non-destructive)
create table event_station_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  version_id uuid not null references model_versions(id),
  station_id text not null, -- References mv_stations.station_id
  -- Override fields (null = use original)
  display_name_override text,
  activity_override jsonb,
  enabled_override boolean,
  -- Location binding
  lat double precision,
  lng double precision,
  address text,
  media_user_clip_id uuid references media_assets(id),
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Ensure unique station per event
  unique(event_id, station_id),
  -- Foreign key to ensure station exists in version
  foreign key (version_id, station_id) references mv_stations(version_id, station_id)
);

-- Event-specific mission overrides (non-destructive)
create table event_mission_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  version_id uuid not null references model_versions(id),
  mission_id uuid not null, -- References mv_missions.mission_id
  -- Override fields (null = use original)
  title_override text,
  clue_override jsonb,
  overlay_spec_override jsonb,
  -- Rendering status for this specific event
  compiled_video_asset_id uuid references media_assets(id),
  compiled_status text not null default 'pending' check (compiled_status in ('pending','queued','rendering','ready','failed')),
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Ensure unique mission per event
  unique(event_id, mission_id),
  -- Foreign key to ensure mission exists in version
  foreign key (version_id, mission_id) references mv_missions(version_id, mission_id)
);

-- ============================================================================
-- 4. Graph-based Routing Engine
-- ============================================================================

-- Node definitions for routing graph
create table event_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  version_id uuid not null references model_versions(id),
  -- Node identification
  node_type text not null check (node_type in ('station', 'mission', 'checkpoint', 'terminus')),
  node_ref_id text not null, -- station_id, mission_id, etc.
  -- Graph metadata
  node_label text not null,
  node_order integer,
  -- Team filtering (null = applies to all teams)
  team_constraint jsonb, -- e.g., {"teams": ["RED", "BLUE"], "exclude": ["GREEN"]}
  -- Conditional predicates
  requires_conditions jsonb, -- e.g., {"visited_stations": ["A", "B"], "min_score": 50}
  unlock_conditions jsonb,   -- e.g., {"time_after": "10:00", "weather": "sunny"}
  -- Metadata
  created_at timestamptz default now(),

  -- Ensure unique nodes per event
  unique(event_id, node_type, node_ref_id)
);

-- Edge definitions for routing graph
create table event_graph_edges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  version_id uuid not null references model_versions(id),
  -- Edge definition
  from_node_id uuid not null references event_graph_nodes(id) on delete cascade,
  to_node_id uuid not null references event_graph_nodes(id) on delete cascade,
  -- Edge properties
  edge_weight integer default 1,
  edge_type text not null default 'normal' check (edge_type in ('normal', 'conditional', 'fallback', 'shortcut')),
  -- Conditions for traversal
  traverse_conditions jsonb, -- Predicates that must be true to follow this edge
  traverse_probability decimal(3,2) default 1.0 check (traverse_probability between 0.0 and 1.0),
  -- Team constraints
  team_constraint jsonb,
  -- Metadata
  edge_label text,
  created_at timestamptz default now(),

  -- Prevent self-loops and duplicate edges
  check (from_node_id != to_node_id),
  unique(event_id, from_node_id, to_node_id, team_constraint)
);

-- ============================================================================
-- 5. Robust Render Pipeline
-- ============================================================================

-- Job queue for video rendering with full state tracking
create table render_jobs (
  id uuid primary key default gen_random_uuid(),
  -- Job identification
  job_type text not null check (job_type in ('mission_video', 'compilation', 'preview')),
  event_id uuid not null references events(id) on delete cascade,
  mission_override_id uuid references event_mission_overrides(id) on delete cascade,
  -- Input specification
  input_spec jsonb not null, -- Complete input definition
  output_spec jsonb not null, -- Expected output specification
  -- Job state
  status text not null default 'pending' check (status in ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled')),
  priority integer not null default 100,
  -- Progress tracking
  progress_percentage integer default 0 check (progress_percentage between 0 and 100),
  current_stage text,
  stages_total integer,
  stages_completed integer default 0,
  -- Resource allocation
  worker_id text, -- ID of worker processing this job
  allocated_at timestamptz,
  max_processing_time_minutes integer default 30,
  -- Results
  output_asset_id uuid references media_assets(id),
  output_metadata jsonb,
  -- Error handling
  error_message text,
  error_details jsonb,
  retry_count integer default 0,
  max_retries integer default 3,
  -- Timing
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Constraints
  check (retry_count <= max_retries),
  check (stages_completed <= stages_total)
);

-- ============================================================================
-- 6. Indexes for Performance
-- ============================================================================

-- Model version indexes
create index idx_model_versions_model_id on model_versions(model_id);
create index idx_model_versions_published on model_versions(model_id, is_published, published_at desc);
create index idx_model_versions_content_hash on model_versions(content_hash);

-- Snapshot table indexes
create index idx_mv_stations_version_id on mv_stations(version_id);
create index idx_mv_stations_station_id on mv_stations(station_id);
create index idx_mv_missions_version_id on mv_missions(version_id);
create index idx_mv_missions_mission_id on mv_missions(mission_id);
create index idx_mv_missions_to_station on mv_missions(version_id, to_station_id);
create index idx_mv_video_scenes_version_id on mv_video_scenes(version_id);
create index idx_mv_video_scenes_template on mv_video_scenes(template_asset_id);

-- Override table indexes
create index idx_event_station_overrides_event on event_station_overrides(event_id);
create index idx_event_station_overrides_version on event_station_overrides(version_id);
create index idx_event_mission_overrides_event on event_mission_overrides(event_id);
create index idx_event_mission_overrides_version on event_mission_overrides(version_id);
create index idx_event_mission_overrides_status on event_mission_overrides(compiled_status);

-- Graph table indexes
create index idx_event_graph_nodes_event on event_graph_nodes(event_id);
create index idx_event_graph_nodes_version on event_graph_nodes(version_id);
create index idx_event_graph_nodes_type_ref on event_graph_nodes(node_type, node_ref_id);
create index idx_event_graph_edges_event on event_graph_edges(event_id);
create index idx_event_graph_edges_from on event_graph_edges(from_node_id);
create index idx_event_graph_edges_to on event_graph_edges(to_node_id);

-- Render job indexes
create index idx_render_jobs_status on render_jobs(status);
create index idx_render_jobs_event on render_jobs(event_id);
create index idx_render_jobs_priority on render_jobs(status, priority desc, created_at);
create index idx_render_jobs_worker on render_jobs(worker_id, status);
create index idx_render_jobs_mission_override on render_jobs(mission_override_id);

-- ============================================================================
-- 7. Row Level Security Policies
-- ============================================================================

-- Enable RLS on all new tables
alter table model_versions enable row level security;
alter table mv_stations enable row level security;
alter table mv_missions enable row level security;
alter table mv_video_scenes enable row level security;
alter table event_station_overrides enable row level security;
alter table event_mission_overrides enable row level security;
alter table event_graph_nodes enable row level security;
alter table event_graph_edges enable row level security;
alter table render_jobs enable row level security;

-- Model version policies
create policy "Users can view model versions in their orgs" on model_versions
  for select using (
    model_id in (
      select id from hunt_models where org_id in (
        select org_id from org_members where user_id = auth.uid()
      )
    )
  );

create policy "Users can manage model versions in their orgs" on model_versions
  for all using (
    model_id in (
      select id from hunt_models where org_id in (
        select org_id from org_members
        where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
      )
    )
  );

-- Snapshot table policies (inherit from model_versions)
create policy "Users can view mv_stations in their orgs" on mv_stations
  for select using (
    version_id in (
      select id from model_versions where model_id in (
        select id from hunt_models where org_id in (
          select org_id from org_members where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can view mv_missions in their orgs" on mv_missions
  for select using (
    version_id in (
      select id from model_versions where model_id in (
        select id from hunt_models where org_id in (
          select org_id from org_members where user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can view mv_video_scenes in their orgs" on mv_video_scenes
  for select using (
    version_id in (
      select id from model_versions where model_id in (
        select id from hunt_models where org_id in (
          select org_id from org_members where user_id = auth.uid()
        )
      )
    )
  );

-- Override table policies (inherit from events)
create policy "Users can view event station overrides" on event_station_overrides
  for select using (
    event_id in (
      select id from events where
        org_id in (select org_id from org_members where user_id = auth.uid()) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can manage event station overrides" on event_station_overrides
  for all using (
    event_id in (
      select id from events where
        org_id in (
          select org_id from org_members
          where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
        ) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can view event mission overrides" on event_mission_overrides
  for select using (
    event_id in (
      select id from events where
        org_id in (select org_id from org_members where user_id = auth.uid()) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can manage event mission overrides" on event_mission_overrides
  for all using (
    event_id in (
      select id from events where
        org_id in (
          select org_id from org_members
          where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
        ) or
        buyer_user_id = auth.uid()
    )
  );

-- Graph table policies (inherit from events)
create policy "Users can view event graph nodes" on event_graph_nodes
  for select using (
    event_id in (
      select id from events where
        org_id in (select org_id from org_members where user_id = auth.uid()) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can manage event graph nodes" on event_graph_nodes
  for all using (
    event_id in (
      select id from events where
        org_id in (
          select org_id from org_members
          where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
        ) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can view event graph edges" on event_graph_edges
  for select using (
    event_id in (
      select id from events where
        org_id in (select org_id from org_members where user_id = auth.uid()) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can manage event graph edges" on event_graph_edges
  for all using (
    event_id in (
      select id from events where
        org_id in (
          select org_id from org_members
          where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
        ) or
        buyer_user_id = auth.uid()
    )
  );

-- Render job policies (inherit from events)
create policy "Users can view render jobs for their events" on render_jobs
  for select using (
    event_id in (
      select id from events where
        org_id in (select org_id from org_members where user_id = auth.uid()) or
        buyer_user_id = auth.uid()
    )
  );

create policy "Users can manage render jobs for their events" on render_jobs
  for all using (
    event_id in (
      select id from events where
        org_id in (
          select org_id from org_members
          where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
        ) or
        buyer_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. Helper Functions and Views
-- ============================================================================

-- Get latest published version for a model
create or replace function get_latest_model_version(model_uuid uuid)
returns uuid as $$
  select id from model_versions
  where model_id = model_uuid
    and is_published = true
  order by published_at desc
  limit 1;
$$ language sql security definer;

-- Get model content for a specific version
create or replace view model_content_view as
select
  mv.id as version_id,
  mv.model_id,
  mv.version_number,
  mv.content_hash,
  mv.published_at,
  -- Aggregate stations
  coalesce(
    json_agg(
      json_build_object(
        'id', mvs.station_id,
        'display_name', mvs.display_name,
        'type', mvs.station_type,
        'default_activity', mvs.default_activity,
        'order', mvs.snapshot_order
      ) order by mvs.snapshot_order
    ) filter (where mvs.id is not null),
    '[]'::json
  ) as stations,
  -- Aggregate missions
  coalesce(
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
      ) order by mvm.snapshot_order
    ) filter (where mvm.id is not null),
    '[]'::json
  ) as missions
from model_versions mv
left join mv_stations mvs on mv.id = mvs.version_id
left join mv_missions mvm on mv.id = mvm.version_id
group by mv.id, mv.model_id, mv.version_number, mv.content_hash, mv.published_at;

-- ============================================================================
-- 9. Automatic Triggers and Functions
-- ============================================================================

-- Function to update render job timestamps
create or replace function update_render_job_timestamps()
returns trigger as $$
begin
  new.updated_at = now();

  -- Set timing fields based on status changes
  if old.status != new.status then
    case new.status
      when 'queued' then new.queued_at = now();
      when 'processing' then new.started_at = now();
      when 'completed', 'failed', 'cancelled' then new.completed_at = now();
      else null;
    end case;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger render_job_timestamps
  before update on render_jobs
  for each row execute function update_render_job_timestamps();

-- Function to update event override timestamps
create or replace function update_override_timestamps()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger event_station_override_timestamps
  before update on event_station_overrides
  for each row execute function update_override_timestamps();

create trigger event_mission_override_timestamps
  before update on event_mission_overrides
  for each row execute function update_override_timestamps();

-- ============================================================================
-- 10. Comments for Documentation
-- ============================================================================

comment on table model_versions is 'Immutable snapshots of hunt models for version control and consistency';
comment on table mv_stations is 'Immutable station snapshots referenced by model versions';
comment on table mv_missions is 'Immutable mission snapshots referenced by model versions';
comment on table mv_video_scenes is 'Immutable video scene snapshots referenced by model versions';
comment on table event_station_overrides is 'Event-specific station customizations without modifying original model';
comment on table event_mission_overrides is 'Event-specific mission customizations without modifying original model';
comment on table event_graph_nodes is 'Graph nodes for advanced routing engine with conditional logic';
comment on table event_graph_edges is 'Graph edges defining routing paths with predicates and constraints';
comment on table render_jobs is 'Robust job queue for video rendering with full state management';

comment on function get_latest_model_version(uuid) is 'Returns the latest published version ID for a given model';
comment on view model_content_view is 'Aggregated view of complete model content for any version';