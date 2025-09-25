import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSchema() {
  try {
    // Test if tables exist by attempting to select from them
    console.log('Testing team_messages table...')
    const { error: messagesError } = await supabase
      .from('team_messages')
      .select('id')
      .limit(1)

    if (messagesError) {
      console.log('Creating team_messages table...')
      const { error } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE team_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL,
            team_id UUID,
            sender_id UUID,
            sender_type TEXT NOT NULL CHECK (sender_type IN ('team', 'organizer', 'system')),
            message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'announcement', 'hint', 'emergency')),
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            parent_message_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      console.log('team_messages creation result:', error || 'Success')
    } else {
      console.log('team_messages table already exists')
    }

    console.log('Testing team_notifications table...')
    const { error: notificationsError } = await supabase
      .from('team_notifications')
      .select('id')
      .limit(1)

    if (notificationsError) {
      console.log('Creating team_notifications table...')
      const { error } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE team_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL,
            team_id UUID,
            notification_type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      console.log('team_notifications creation result:', error || 'Success')
    } else {
      console.log('team_notifications table already exists')
    }

    console.log('Testing team_announcements table...')
    const { error: announcementsError } = await supabase
      .from('team_announcements')
      .select('id')
      .limit(1)

    if (announcementsError) {
      console.log('Creating team_announcements table...')
      const { error } = await supabase.rpc('sql', {
        query: `
          CREATE TABLE team_announcements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL,
            author_id UUID NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            announcement_type TEXT NOT NULL,
            is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
            target_teams UUID[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      console.log('team_announcements creation result:', error || 'Success')
    } else {
      console.log('team_announcements table already exists')
    }

    console.log('Schema test completed!')

  } catch (error) {
    console.error('Error:', error)
  }
}

testSchema()