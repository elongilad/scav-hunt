export interface Organization {
  id: string
  name: string
  owner_user_id: string
  created_at: string
}

export interface OrgMember {
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

export interface MediaAsset {
  id: string
  org_id: string
  kind: 'video' | 'audio' | 'image'
  storage_path: string
  provider: string
  embed_url?: string
  duration_seconds?: number
  language: string
  meta?: any
  created_at: string
}

export interface HuntModel {
  id: string
  org_id: string
  name: string
  description?: string
  locale: string
  active: boolean
  created_at: string
}

export interface ModelStation {
  id: string
  model_id: string
  display_name: string
  type?: string
  default_activity?: any
  created_at: string
}

export interface ModelMission {
  id: string
  model_id: string
  to_station_id: string
  title?: string
  clue?: any
  video_template_id?: string
  overlay_spec?: any
  locale: string
  active: boolean
  created_at: string
}

export interface VideoTemplateScene {
  id: string
  template_asset_id: string
  order_index: number
  scene_type: 'intro' | 'user_clip' | 'overlay' | 'outro'
  start_ms?: number
  end_ms?: number
  overlay_text?: any
  created_at: string
}

export interface Event {
  id: string
  org_id: string
  model_id?: string
  buyer_user_id?: string
  child_name?: string
  date_start?: string
  teams_count: number
  locale: string
  status: 'draft' | 'ready' | 'active' | 'completed' | 'archived'
  created_at: string
}

export interface EventStation {
  id: string
  event_id: string
  model_station_id?: string
  name?: string
  lat?: number
  lng?: number
  address?: string
  media_user_clip_id?: string
  enabled: boolean
  created_at: string
}

export interface EventMission {
  id: string
  event_id: string
  to_event_station_id: string
  model_mission_id?: string
  compiled_video_asset_id?: string
  compiled_status: 'pending' | 'queued' | 'rendering' | 'ready' | 'failed'
  created_at: string
}

export interface EventTeam {
  id: string
  event_id: string
  name: string
  password: string
  emblem_asset_id?: string
  color?: string
  index?: number
}

export interface EventTransition {
  id: string
  event_id: string
  from_event_station_id: string
  event_team_id?: string
  mission_id: string
  priority: number
  active: boolean
}

export interface EventVisit {
  id: number
  event_id: string
  event_team_id?: string
  team_password?: string
  station_id?: string
  success: boolean
  scanned_at: string
}

export interface Purchase {
  id: string
  event_id: string
  price_cents: number
  currency: string
  stripe_payment_intent_id?: string
  status: 'requires_payment' | 'paid' | 'refunded'
  created_at: string
}

// UI Types
export interface StationMapPoint {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  type?: string
}

export interface MissionCompileJob {
  missionId: string
  templateAssetId: string
  userClipAssetId?: string
  overlaySpec?: any
  outputPath: string
}

export interface TeamRoute {
  teamId: string
  stations: EventStation[]
  missions: EventMission[]
}

export interface PlaygroundState {
  currentStationId?: string
  currentTeamPassword?: string
  visitHistory: EventVisit[]
}