-- 01_stations_missions_simulation_checklists.sql (idempotent, additive, safe)
-- Migration to add advanced event management features

/* =============================
   Team-scoped mission↔station
   ============================= */
CREATE TABLE IF NOT EXISTS public.event_team_mission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_team_id uuid NOT NULL REFERENCES public.event_teams(id) ON DELETE CASCADE,
  event_mission_id uuid NOT NULL REFERENCES public.event_mission_overrides(id) ON DELETE CASCADE,
  event_station_id uuid NOT NULL REFERENCES public.event_stations(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, event_team_id, event_mission_id)
);
CREATE INDEX IF NOT EXISTS idx_etma_event ON public.event_team_mission_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_etma_team ON public.event_team_mission_assignments(event_team_id);
CREATE INDEX IF NOT EXISTS idx_etma_mission ON public.event_team_mission_assignments(event_mission_id);
CREATE INDEX IF NOT EXISTS idx_etma_station ON public.event_team_mission_assignments(event_station_id);
ALTER TABLE public.event_team_mission_assignments ENABLE ROW LEVEL SECURITY;

/* Mirror your existing RLS pattern: org members read; editor+ write */
DROP POLICY IF EXISTS etma_select ON public.event_team_mission_assignments;
CREATE POLICY etma_select ON public.event_team_mission_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id
    WHERE e.id=event_id AND om.user_id=auth.uid()
  ));

DROP POLICY IF EXISTS etma_write ON public.event_team_mission_assignments;
CREATE POLICY etma_write ON public.event_team_mission_assignments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id
    WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id
    WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')
  ));

/* =============================
   Stations metadata
   ============================= */
ALTER TABLE public.event_stations
  ADD COLUMN IF NOT EXISTS kind text CHECK (kind IN ('qr_filler','activity','hq_activity')),
  ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS setup_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_hq boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

/* =============================
   Missions capabilities & overrides
   ============================= */
ALTER TABLE public.model_missions
  ADD COLUMN IF NOT EXISTS requires_video boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_photo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_actor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hq_candidate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_candidate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prop_requirements jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.event_mission_overrides
  ADD COLUMN IF NOT EXISTS requires_video boolean,
  ADD COLUMN IF NOT EXISTS requires_photo boolean,
  ADD COLUMN IF NOT EXISTS requires_actor boolean,
  ADD COLUMN IF NOT EXISTS hq_candidate boolean,
  ADD COLUMN IF NOT EXISTS activity_candidate boolean,
  ADD COLUMN IF NOT EXISTS prop_requirements jsonb,
  ADD COLUMN IF NOT EXISTS expected_minutes integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS p95_minutes integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS variant text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allow_hq_activities boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_actor_interactions boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS prefer_no_video_capture boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_prep_minutes integer DEFAULT 90;

/* =============================
   Mission order & prerequisites
   ============================= */
CREATE TABLE IF NOT EXISTS public.event_mission_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  from_event_mission uuid NOT NULL REFERENCES public.event_mission_overrides(id) ON DELETE CASCADE,
  to_event_mission uuid NOT NULL REFERENCES public.event_mission_overrides(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT true,
  UNIQUE (event_id, from_event_mission, is_primary)
);
CREATE INDEX IF NOT EXISTS idx_eme_event_from ON public.event_mission_edges(event_id, from_event_mission);

CREATE TABLE IF NOT EXISTS public.event_mission_prereqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  before_event_mission uuid NOT NULL REFERENCES public.event_mission_overrides(id) ON DELETE CASCADE,
  after_event_mission uuid NOT NULL REFERENCES public.event_mission_overrides(id) ON DELETE CASCADE,
  UNIQUE (event_id, before_event_mission, after_event_mission)
);

/* =============================
   Travel-time matrix (walking)
   ============================= */
CREATE TABLE IF NOT EXISTS public.event_station_travel_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  from_station_id uuid NOT NULL REFERENCES public.event_stations(id) ON DELETE CASCADE,
  to_station_id uuid NOT NULL REFERENCES public.event_stations(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'walking',
  seconds integer NOT NULL,
  meters integer NOT NULL,
  provider text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, from_station_id, to_station_id, mode)
);
CREATE INDEX IF NOT EXISTS idx_estt_event_from_to ON public.event_station_travel_times(event_id, from_station_id, to_station_id);
ALTER TABLE public.event_station_travel_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS estt_select ON public.event_station_travel_times;
CREATE POLICY estt_select ON public.event_station_travel_times
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid()));

DROP POLICY IF EXISTS estt_write ON public.event_station_travel_times;
CREATE POLICY estt_write ON public.event_station_travel_times
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')));

/* =============================
   POI suggestions & decisions
   ============================= */
CREATE TABLE IF NOT EXISTS public.event_poi_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_place_id text NOT NULL,
  name text NOT NULL,
  category text,
  subcategory text,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  distance_m integer NOT NULL,
  score double precision NOT NULL,
  tags jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, provider, provider_place_id)
);
CREATE INDEX IF NOT EXISTS idx_poi_event ON public.event_poi_suggestions(event_id);
ALTER TABLE public.event_poi_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS poi_select ON public.event_poi_suggestions;
CREATE POLICY poi_select ON public.event_poi_suggestions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid()));

DROP POLICY IF EXISTS poi_write ON public.event_poi_suggestions;
CREATE POLICY poi_write ON public.event_poi_suggestions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')));

CREATE TABLE IF NOT EXISTS public.event_poi_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  poi_id uuid NOT NULL REFERENCES public.event_poi_suggestions(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('accepted','rejected')),
  decided_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid NOT NULL REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_poid_event ON public.event_poi_decisions(event_id);
ALTER TABLE public.event_poi_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS poid_all ON public.event_poi_decisions;
CREATE POLICY poid_all ON public.event_poi_decisions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid()));

/* =============================
   Checklists & tasks
   ============================= */
CREATE TABLE IF NOT EXISTS public.event_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('pre_event','day_of')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','completed')),
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, phase)
);

CREATE TABLE IF NOT EXISTS public.event_checklist_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.event_checklists(id) ON DELETE CASCADE,
  event_mission_id uuid REFERENCES public.event_mission_overrides(id) ON DELETE SET NULL,
  event_station_id uuid REFERENCES public.event_stations(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  required boolean NOT NULL DEFAULT true,
  due_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','skipped')),
  result_media_ids uuid[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ecl_event ON public.event_checklists(event_id, phase);
CREATE INDEX IF NOT EXISTS idx_eclt_checklist ON public.event_checklist_tasks(checklist_id);
CREATE INDEX IF NOT EXISTS idx_eclt_context ON public.event_checklist_tasks(event_station_id, event_mission_id);
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklist_tasks ENABLE ROW LEVEL SECURITY;

/* Add RLS policies for checklists */
DROP POLICY IF EXISTS checklist_select ON public.event_checklists;
CREATE POLICY checklist_select ON public.event_checklists
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid()));

DROP POLICY IF EXISTS checklist_write ON public.event_checklists;
CREATE POLICY checklist_write ON public.event_checklists
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e JOIN public.org_members om ON om.org_id=e.org_id WHERE e.id=event_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')));

DROP POLICY IF EXISTS checklist_task_select ON public.event_checklist_tasks;
CREATE POLICY checklist_task_select ON public.event_checklist_tasks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_checklists c
    JOIN public.events e ON e.id=c.event_id
    JOIN public.org_members om ON om.org_id=e.org_id
    WHERE c.id=checklist_id AND om.user_id=auth.uid()
  ));

DROP POLICY IF EXISTS checklist_task_write ON public.event_checklist_tasks;
CREATE POLICY checklist_task_write ON public.event_checklist_tasks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_checklists c
    JOIN public.events e ON e.id=c.event_id
    JOIN public.org_members om ON om.org_id=e.org_id
    WHERE c.id=checklist_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.event_checklists c
    JOIN public.events e ON e.id=c.event_id
    JOIN public.org_members om ON om.org_id=e.org_id
    WHERE c.id=checklist_id AND om.user_id=auth.uid() AND om.role IN ('editor','admin','owner')
  ));

/* =============================
   Data backfill for existing records
   ============================= */
-- Update existing model missions with sensible defaults
UPDATE public.model_missions
SET
  requires_video = false,
  requires_photo = true,
  requires_actor = false,
  hq_candidate = false,
  activity_candidate = true,
  prop_requirements = '[]'::jsonb
WHERE requires_video IS NULL;

-- Update existing events with sensible defaults
UPDATE public.events
SET
  allow_hq_activities = true,
  allow_actor_interactions = true,
  prefer_no_video_capture = false,
  max_prep_minutes = 90
WHERE allow_hq_activities IS NULL;