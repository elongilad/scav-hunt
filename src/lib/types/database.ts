export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string
          name: string
          owner_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_user_id?: string
          created_at?: string
        }
      }
      org_members: {
        Row: {
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
        }
        Insert: {
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
        }
      }
      media_assets: {
        Row: {
          id: string
          org_id: string
          kind: 'video' | 'audio' | 'image'
          storage_path: string
          provider: string
          embed_url: string | null
          duration_seconds: number | null
          language: string
          meta: any
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          kind: 'video' | 'audio' | 'image'
          storage_path: string
          provider?: string
          embed_url?: string | null
          duration_seconds?: number | null
          language?: string
          meta?: any
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          kind?: 'video' | 'audio' | 'image'
          storage_path?: string
          provider?: string
          embed_url?: string | null
          duration_seconds?: number | null
          language?: string
          meta?: any
          created_at?: string
        }
      }
      hunt_models: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          locale: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          locale?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          locale?: string
          active?: boolean
          created_at?: string
        }
      }
      model_stations: {
        Row: {
          id: string
          model_id: string
          display_name: string
          type: string | null
          default_activity: any
          created_at: string
        }
        Insert: {
          id: string
          model_id: string
          display_name: string
          type?: string | null
          default_activity?: any
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          display_name?: string
          type?: string | null
          default_activity?: any
          created_at?: string
        }
      }
      model_missions: {
        Row: {
          id: string
          model_id: string
          to_station_id: string
          title: string | null
          clue: any
          video_template_id: string | null
          overlay_spec: any
          locale: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          to_station_id: string
          title?: string | null
          clue?: any
          video_template_id?: string | null
          overlay_spec?: any
          locale?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          to_station_id?: string
          title?: string | null
          clue?: any
          video_template_id?: string | null
          overlay_spec?: any
          locale?: string
          active?: boolean
          created_at?: string
        }
      }
      video_template_scenes: {
        Row: {
          id: string
          template_asset_id: string
          order_index: number
          scene_type: 'intro' | 'user_clip' | 'overlay' | 'outro'
          start_ms: number | null
          end_ms: number | null
          overlay_text: any
          created_at: string
        }
        Insert: {
          id?: string
          template_asset_id: string
          order_index: number
          scene_type: 'intro' | 'user_clip' | 'overlay' | 'outro'
          start_ms?: number | null
          end_ms?: number | null
          overlay_text?: any
          created_at?: string
        }
        Update: {
          id?: string
          template_asset_id?: string
          order_index?: number
          scene_type?: 'intro' | 'user_clip' | 'overlay' | 'outro'
          start_ms?: number | null
          end_ms?: number | null
          overlay_text?: any
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          org_id: string
          model_id: string | null
          buyer_user_id: string | null
          child_name: string | null
          date_start: string | null
          teams_count: number
          locale: string
          status: 'draft' | 'ready' | 'active' | 'completed' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          model_id?: string | null
          buyer_user_id?: string | null
          child_name?: string | null
          date_start?: string | null
          teams_count?: number
          locale?: string
          status?: 'draft' | 'ready' | 'active' | 'completed' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          model_id?: string | null
          buyer_user_id?: string | null
          child_name?: string | null
          date_start?: string | null
          teams_count?: number
          locale?: string
          status?: 'draft' | 'ready' | 'active' | 'completed' | 'archived'
          created_at?: string
        }
      }
      event_stations: {
        Row: {
          id: string
          event_id: string
          model_station_id: string | null
          name: string | null
          lat: number | null
          lng: number | null
          address: string | null
          media_user_clip_id: string | null
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          model_station_id?: string | null
          name?: string | null
          lat?: number | null
          lng?: number | null
          address?: string | null
          media_user_clip_id?: string | null
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          model_station_id?: string | null
          name?: string | null
          lat?: number | null
          lng?: number | null
          address?: string | null
          media_user_clip_id?: string | null
          enabled?: boolean
          created_at?: string
        }
      }
      event_missions: {
        Row: {
          id: string
          event_id: string
          to_event_station_id: string
          model_mission_id: string | null
          compiled_video_asset_id: string | null
          compiled_status: 'pending' | 'queued' | 'rendering' | 'ready' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          to_event_station_id: string
          model_mission_id?: string | null
          compiled_video_asset_id?: string | null
          compiled_status?: 'pending' | 'queued' | 'rendering' | 'ready' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          to_event_station_id?: string
          model_mission_id?: string | null
          compiled_video_asset_id?: string | null
          compiled_status?: 'pending' | 'queued' | 'rendering' | 'ready' | 'failed'
          created_at?: string
        }
      }
      event_teams: {
        Row: {
          id: string
          event_id: string
          name: string
          password: string
          emblem_asset_id: string | null
          color: string | null
          index: number | null
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          password: string
          emblem_asset_id?: string | null
          color?: string | null
          index?: number | null
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          password?: string
          emblem_asset_id?: string | null
          color?: string | null
          index?: number | null
        }
      }
      event_transitions: {
        Row: {
          id: string
          event_id: string
          from_event_station_id: string
          event_team_id: string | null
          mission_id: string
          priority: number
          active: boolean
        }
        Insert: {
          id?: string
          event_id: string
          from_event_station_id: string
          event_team_id?: string | null
          mission_id: string
          priority?: number
          active?: boolean
        }
        Update: {
          id?: string
          event_id?: string
          from_event_station_id?: string
          event_team_id?: string | null
          mission_id?: string
          priority?: number
          active?: boolean
        }
      }
      event_visits: {
        Row: {
          id: number
          event_id: string
          event_team_id: string | null
          team_password: string | null
          station_id: string | null
          success: boolean
          scanned_at: string
        }
        Insert: {
          id?: number
          event_id: string
          event_team_id?: string | null
          team_password?: string | null
          station_id?: string | null
          success?: boolean
          scanned_at?: string
        }
        Update: {
          id?: number
          event_id?: string
          event_team_id?: string | null
          team_password?: string | null
          station_id?: string | null
          success?: boolean
          scanned_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          event_id: string
          price_cents: number
          currency: string
          stripe_payment_intent_id: string | null
          status: 'requires_payment' | 'paid' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          price_cents: number
          currency?: string
          stripe_payment_intent_id?: string | null
          status: 'requires_payment' | 'paid' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          price_cents?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          status?: 'requires_payment' | 'paid' | 'refunded'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_role: {
        Args: {
          user_id: string
          org_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}