#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Testing database connection...');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Service key:', supabaseServiceKey ? '***PRESENT***' : '***MISSING***');

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('🧪 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('orgs')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test existing tables by checking known tables
    console.log('🔍 Checking existing known tables...');
    const knownTables = ['orgs', 'hunt_models', 'events', 'model_stations'];
    const existingTables = [];

    for (const table of knownTables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          existingTables.push(table);
        }
      } catch (e) {
        // Table doesn't exist or no access
      }
    }

    console.log('📋 Existing known tables:', existingTables.join(', '));

    // Check if Phase 1 tables exist
    const phase1Tables = ['model_versions', 'mv_stations', 'mv_missions', 'render_jobs'];
    const existingPhase1Tables = [];

    for (const table of phase1Tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          existingPhase1Tables.push(table);
        }
      } catch (e) {
        // Table doesn't exist or no access
      }
    }

    if (existingPhase1Tables.length > 0) {
      console.log('⚠️  Some Phase 1 tables already exist:', existingPhase1Tables.join(', '));
    } else {
      console.log('💡 No Phase 1 tables found - ready for schema application');
    }

    return true;

  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
    return false;
  }
}

async function createBasicTable() {
  try {
    console.log('🧪 Testing table creation with a simple test table...');

    // Try to create a simple test table
    const createTableSQL = `
      create table if not exists test_phase1_schema (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        created_at timestamptz default now()
      )
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ Error creating test table:', error.message);
      return false;
    }

    console.log('✅ Test table created successfully');

    // Clean up test table
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'drop table if exists test_phase1_schema'
    });

    if (dropError) {
      console.warn('⚠️  Warning: Could not clean up test table:', dropError.message);
    } else {
      console.log('🧹 Test table cleaned up');
    }

    return true;

  } catch (error) {
    console.error('💥 Table creation test failed:', error.message);
    return false;
  }
}

async function main() {
  const connectionOk = await testConnection();

  if (!connectionOk) {
    console.error('💥 Cannot proceed with schema application - connection failed');
    process.exit(1);
  }

  const tableCreationOk = await createBasicTable();

  if (!tableCreationOk) {
    console.error('💥 Cannot proceed with schema application - table creation failed');
    process.exit(1);
  }

  console.log('🎉 Database connection and basic operations work correctly!');
  console.log('🚀 Ready to apply Phase 1 schema');
}

if (require.main === module) {
  main();
}