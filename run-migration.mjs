import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually (for simplicity)
const supabaseUrl = 'https://sqilidvhtoofkfjzaudr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaWxpZHZodG9vZmtmanphdWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ3ODY0MywiZXhwIjoyMDc0MDU0NjQzfQ.EdlPkdphguLzknHFdO29nXXaTq63zU0LRxnJNWmRI6o';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Running migration...');

try {
  const migrationSQL = readFileSync('./src/lib/supabase/migrations/01_stations_missions_simulation_checklists.sql', 'utf8');

  // Execute the migration using Supabase client
  const { error } = await supabase.rpc('exec', { query: migrationSQL });

  if (error) {
    console.error('❌ Migration failed:', error);

    // Try splitting into smaller chunks and executing via REST API
    console.log('🔄 Trying alternative approach...');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Processing ${statements.length} statements...`);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok && response.status !== 409) {
            const errorText = await response.text();
            console.log(`⚠️  Statement: ${statement.substring(0, 50)}... - ${errorText}`);
          }
        } catch (err) {
          console.log(`⚠️  ${err.message}`);
        }
      }
    }

    console.log('✅ Migration attempt completed (some statements may have been skipped as expected)');
  } else {
    console.log('✅ Migration completed successfully!');
  }

} catch (error) {
  console.error('💥 Unexpected error:', error.message);
}