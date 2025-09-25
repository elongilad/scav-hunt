import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchema() {
  try {
    console.log('Creating team communication tables...')

    // Create team_messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS team_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
          team_id UUID REFERENCES hunt_teams(id) ON DELETE CASCADE,
          sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          sender_type TEXT NOT NULL CHECK (sender_type IN ('team', 'organizer', 'system')),
          message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'announcement', 'hint', 'emergency')),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          parent_message_id UUID REFERENCES team_messages(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (messagesError) {
      console.log('Messages table already exists or error:', messagesError.message)
    }

    // Create team_notifications table
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS team_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL REFERENCES hunt_events(id) ON DELETE CASCADE,
          team_id UUID REFERENCES hunt_teams(id) ON DELETE CASCADE,
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
      `
    })

    if (notificationsError) {
      console.log('Notifications table already exists or error:', notificationsError.message)
    }

    // Create team_announcements table
    const { error: announcementsError } = await supabase.rpc('exec_sql', {
      sql: `
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
          target_teams UUID[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (announcementsError) {
      console.log('Announcements table already exists or error:', announcementsError.message)
    }

    console.log('Communication schema applied successfully!')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

applySchema()