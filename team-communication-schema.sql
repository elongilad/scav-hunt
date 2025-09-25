-- Real-time Team Communication Schema
-- This schema supports messaging, notifications, and announcements

-- Create team_messages table for team communications
CREATE TABLE IF NOT EXISTS team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES hunt_teams(id) ON DELETE CASCADE, -- NULL for broadcast messages
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('team', 'organizer', 'system')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'announcement', 'hint', 'emergency')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  parent_message_id UUID REFERENCES team_messages(id) ON DELETE CASCADE, -- For reply threads
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_notifications table for system notifications
CREATE TABLE IF NOT EXISTS team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES hunt_teams(id) ON DELETE CASCADE, -- NULL for broadcast
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'mission_assigned', 'route_updated', 'station_unlocked', 'hint_available',
    'time_warning', 'event_update', 'emergency', 'achievement', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_announcements table for event-wide announcements
CREATE TABLE IF NOT EXISTS team_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL CHECK (announcement_type IN (
    'general', 'urgent', 'hint', 'schedule_change', 'weather', 'safety'
  )),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  target_teams UUID[] DEFAULT '{}', -- Empty array means all teams
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_communication_channels table for organized communication
CREATE TABLE IF NOT EXISTS team_communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('general', 'team', 'organizers', 'emergency', 'hints')),
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_teams UUID[] DEFAULT '{}', -- Empty means all teams can access
  allowed_roles TEXT[] DEFAULT '{}', -- ['organizer', 'team', 'viewer']
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_communication_settings table for user preferences
CREATE TABLE IF NOT EXISTS team_communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  sound_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  notification_types JSONB DEFAULT '{}', -- Which notification types to receive
  quiet_hours JSONB DEFAULT '{}', -- Start/end times for quiet hours
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_messages_event_id ON team_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_is_read ON team_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_team_messages_message_type ON team_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_team_notifications_event_id ON team_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_team_id ON team_notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_created_at ON team_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_notifications_is_read ON team_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_team_notifications_type ON team_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_team_announcements_event_id ON team_announcements(event_id);
CREATE INDEX IF NOT EXISTS idx_team_announcements_created_at ON team_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_announcements_is_pinned ON team_announcements(is_pinned);

-- Add RLS policies
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_communication_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_messages
CREATE POLICY "Users can view messages for their events"
  ON team_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hunt_events he
      JOIN hunt_teams ht ON ht.event_id = he.id
      WHERE he.id = team_messages.event_id
      AND (
        he.org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        OR ht.id = team_messages.team_id
        OR team_messages.team_id IS NULL -- Broadcast messages
      )
    )
  );

CREATE POLICY "Users can insert messages for their teams or as organizers"
  ON team_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hunt_events he
      WHERE he.id = team_messages.event_id
      AND (
        he.org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
        OR EXISTS (SELECT 1 FROM hunt_teams ht WHERE ht.id = team_messages.team_id AND ht.event_id = he.id)
      )
    )
  );

-- RLS policies for team_notifications
CREATE POLICY "Users can view notifications for their events"
  ON team_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hunt_events he
      WHERE he.id = team_notifications.event_id
      AND (
        he.org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM hunt_teams ht WHERE ht.id = team_notifications.team_id AND ht.event_id = he.id)
        OR team_notifications.team_id IS NULL
      )
    )
  );

-- RLS policies for team_announcements
CREATE POLICY "Users can view announcements for their events"
  ON team_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hunt_events he
      WHERE he.id = team_announcements.event_id
      AND (
        he.org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
        OR cardinality(target_teams) = 0 -- Broadcast to all teams
        OR EXISTS (SELECT 1 FROM hunt_teams ht WHERE ht.id = ANY(target_teams) AND ht.event_id = he.id)
      )
    )
  );

-- RLS policies for team_communication_settings
CREATE POLICY "Users can manage their own communication settings"
  ON team_communication_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE team_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE team_announcements;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_team_messages_updated_at
  BEFORE UPDATE ON team_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_team_announcements_updated_at
  BEFORE UPDATE ON team_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_team_communication_settings_updated_at
  BEFORE UPDATE ON team_communication_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();