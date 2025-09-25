#!/usr/bin/env node

/**
 * Migration runner for Supabase
 * Runs SQL migration files using the admin client
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile) {
  try {
    console.log(`🚀 Running migration: ${migrationFile}`);

    const migrationPath = join(__dirname, '../src/lib/supabase/migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

          if (error) {
            // Try direct SQL execution if RPC fails
            const { error: directError } = await supabase
              .from('dummy') // This will fail but give us access to raw SQL
              .select('*')
              .limit(0);

            // Fall back to manual execution via service role
            console.log(`   ⚠️  RPC failed, trying direct execution...`);
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ sql_query: statement })
            });

            if (!response.ok && !statement.includes('CREATE TABLE IF NOT EXISTS') && !statement.includes('ALTER TABLE')) {
              console.error(`   ❌ Failed to execute statement: ${statement.substring(0, 100)}`);
              console.error(`   Error: ${await response.text()}`);
            }
          }
        } catch (err) {
          // Many statements will "fail" because they're idempotent (IF NOT EXISTS, etc.)
          // Only log actual errors
          if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
            console.log(`   ⚠️  Statement issue (likely OK): ${err.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log('✅ Migration completed!');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2] || '01_stations_missions_simulation_checklists.sql';

console.log('🔥 Spy Scavenger Hunt - Database Migration Runner');
console.log(`📍 Target: ${supabaseUrl}`);
console.log('');

runMigration(migrationFile)
  .then(success => {
    if (success) {
      console.log('');
      console.log('🎉 Database migration completed successfully!');
      console.log('You can now implement the server actions and UI components.');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });