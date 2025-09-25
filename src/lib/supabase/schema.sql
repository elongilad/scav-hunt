-- Khapesethamatmon: Self-serve spy scavenger hunt platform
-- Complete database schema for Supabase

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users & Organizations
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table org_members (
  org_id uuid references orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  primary key (org_id, user_id)
);

-- Authoring assets (Admin Studio)
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  kind text not null check (kind in ('video','audio','image')),
  storage_path text not null,
  provider text not null default 'supabase', -- or 'cloudflare', 'vimeo'
  embed_url text, 
  duration_seconds int,
  language text default 'he',
  meta jsonb,
  created_at timestamptz default now()
);

-- Hunt Models (authorable templates)
create table hunt_models (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  name text not null,                 -- e.g., "Spy v1 – Age 7–9"
  description text,
  locale text default 'he',
  active boolean default true,
  created_at timestamptz default now()
);

-- Stations (template catalog—not event-specific)
create table model_stations (
  id text primary key,                -- 'SchoolGate', 'Pizza', ...
  model_id uuid references hunt_models(id) on delete cascade,
  display_name text not null,
  type text,                          -- 'qr','puzzle','actor','bomb','book-cipher', etc.
  default_activity jsonb,             -- instructions, props list
  created_at timestamptz default now()
);

-- Missions (reusable "dispatches" - destinations assigned at event level)
create table model_missions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references hunt_models(id) on delete cascade,
  to_station_id text references model_stations(id) on delete cascade, -- nullable since stations assigned at event level
  title text,                         -- "Head to Gan Wizo"
  clue jsonb,                         -- richtext JSON for overlays or text
  video_template_id uuid references media_assets(id), -- template intro/outro
  overlay_spec jsonb,                 -- font, captions, positions
  locale text default 'he',
  active boolean default true,
  created_at timestamptz default now()
);

-- Video Template Timelines (where user clips are inserted)
create table video_template_scenes (
  id uuid primary key default gen_random_uuid(),
  template_asset_id uuid references media_assets(id) on delete cascade,
  order_index int not null,           -- scene order
  scene_type text not null check (scene_type in ('intro','user_clip','overlay','outro')),
  start_ms int, 
  end_ms int,                         -- optional for trim
  overlay_text jsonb,                 -- e.g., {text:"...", x:100,y:50,style:{...}}
  created_at timestamptz default now()
);

-- Event (Organizer flow)
create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  model_id uuid references hunt_models(id) on delete set null,
  buyer_user_id uuid references auth.users(id),
  child_name text,
  date_start timestamptz,
  teams_count int default 5,
  locale text default 'he',
  status text not null default 'draft' check (status in ('draft','ready','active','completed','archived')),
  created_at timestamptz default now()
);

-- Event stations (bound to real places)
create table event_stations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  model_station_id text references model_stations(id),
  name text,                           -- optional override
  lat double precision, 
  lng double precision, 
  address text,
  media_user_clip_id uuid references media_assets(id), -- parent's local clip/photo
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Event missions (compiled from model_missions, referencing event stations)
create table event_missions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  to_event_station_id uuid references event_stations(id) on delete cascade,
  model_mission_id uuid references model_missions(id),
  compiled_video_asset_id uuid references media_assets(id), -- rendered final
  compiled_status text not null default 'pending' check (compiled_status in ('pending','queued','rendering','ready','failed')),
  created_at timestamptz default now()
);

-- Teams (passwords & identity)
create table event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,                 -- צוות אריה...
  password text not null,             -- 1111..5555
  emblem_asset_id uuid references media_assets(id),
  color text, 
  index int
);

-- Transitions (routing rules: FROM station + team → mission)
create table event_transitions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  from_event_station_id uuid references event_stations(id) on delete cascade,
  event_team_id uuid references event_teams(id), -- nullable → applies to all
  mission_id uuid references event_missions(id) not null,
  priority int default 100,
  active boolean default true
);

-- Visits (telemetry)
create table event_visits (
  id bigserial primary key,
  event_id uuid references events(id) on delete cascade,
  event_team_id uuid references event_teams(id),
  team_password text,
  station_id uuid references event_stations(id),
  success boolean not null default true,
  scanned_at timestamptz default now()
);

-- Payments & licenses
create table purchases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  price_cents int not null,
  currency text not null default 'ILS',
  stripe_payment_intent_id text,
  status text not null check (status in ('requires_payment','paid','refunded')),
  created_at timestamptz default now()
);

-- Create indexes for better performance
create index idx_org_members_user_id on org_members(user_id);
create index idx_org_members_org_id on org_members(org_id);
create index idx_media_assets_org_id on media_assets(org_id);
create index idx_hunt_models_org_id on hunt_models(org_id);
create index idx_model_stations_model_id on model_stations(model_id);
create index idx_model_missions_model_id on model_missions(model_id);
create index idx_video_template_scenes_template_id on video_template_scenes(template_asset_id);
create index idx_events_org_id on events(org_id);
create index idx_event_stations_event_id on event_stations(event_id);
create index idx_event_missions_event_id on event_missions(event_id);
create index idx_event_teams_event_id on event_teams(event_id);
create index idx_event_transitions_event_id on event_transitions(event_id);
create index idx_event_visits_event_id on event_visits(event_id);
create index idx_event_visits_team_password on event_visits(team_password);
create index idx_purchases_event_id on purchases(event_id);

-- Row Level Security (RLS) policies
alter table orgs enable row level security;
alter table org_members enable row level security;
alter table media_assets enable row level security;
alter table hunt_models enable row level security;
alter table model_stations enable row level security;
alter table model_missions enable row level security;
alter table video_template_scenes enable row level security;
alter table events enable row level security;
alter table event_stations enable row level security;
alter table event_missions enable row level security;
alter table event_teams enable row level security;
alter table event_transitions enable row level security;
alter table event_visits enable row level security;
alter table purchases enable row level security;

-- Policies for orgs
create policy "Users can view orgs they are members of" on orgs
  for select using (
    id in (
      select org_id from org_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can create orgs" on orgs
  for insert with check (owner_user_id = auth.uid());

create policy "Org owners can update their orgs" on orgs
  for update using (owner_user_id = auth.uid());

-- Policies for org_members
create policy "Users can view org memberships they are part of" on org_members
  for select using (
    user_id = auth.uid() or 
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Org owners and admins can manage memberships" on org_members
  for all using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Policies for media_assets
create policy "Users can view media assets in their orgs" on media_assets
  for select using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can manage media assets in their orgs" on media_assets
  for all using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
    )
  );

-- Policies for hunt_models
create policy "Users can view hunt models in their orgs" on hunt_models
  for select using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can manage hunt models in their orgs" on hunt_models
  for all using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
    )
  );

-- Policies for events (buyers can access their events)
create policy "Users can view events in their orgs or that they bought" on events
  for select using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid()
    ) or buyer_user_id = auth.uid()
  );

create policy "Users can create events in their orgs" on events
  for insert with check (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
    )
  );

create policy "Users can update events they own or bought" on events
  for update using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() and role in ('owner', 'admin', 'editor')
    ) or buyer_user_id = auth.uid()
  );

-- Helper functions
create or replace function get_user_org_role(user_id uuid, org_id uuid)
returns text as $$
  select role from org_members 
  where org_members.user_id = $1 and org_members.org_id = $2;
$$ language sql security definer;

-- Trigger to create default org for new users
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into orgs (name, owner_user_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'My Organization'),
    new.id
  );
  
  insert into org_members (org_id, user_id, role)
  values (
    (select id from orgs where owner_user_id = new.id limit 1),
    new.id,
    'owner'
  );
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Storage buckets for media
insert into storage.buckets (id, name, public)
values 
  ('user-uploads', 'user-uploads', false),
  ('compiled-videos', 'compiled-videos', false),
  ('templates', 'templates', true);

-- Storage policies
create policy "Users can upload files to their org folder" on storage.objects
  for insert with check (
    bucket_id = 'user-uploads' and
    (storage.foldername(name))[1] in (
      select org_id::text from org_members where user_id = auth.uid()
    )
  );

create policy "Users can view files in their org folders" on storage.objects
  for select using (
    bucket_id in ('user-uploads', 'compiled-videos', 'templates') and
    (
      bucket_id = 'templates' or
      (storage.foldername(name))[1] in (
        select org_id::text from org_members where user_id = auth.uid()
      )
    )
  );

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;