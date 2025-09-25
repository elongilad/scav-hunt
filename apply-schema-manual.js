#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPhase1Schema() {
  try {
    console.log('🚀 Starting Phase 1 schema application manually...');

    // Since we can't use exec_sql, we'll use Supabase's built-in operations
    // and focus on what we can verify has been applied

    // Check current schema state
    console.log('🔍 Checking current schema state...');

    // Test connection
    const { error: connectionError } = await supabase.from('orgs').select('count').limit(1);
    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }

    console.log('✅ Database connection successful');

    // Check existing Phase 1 tables
    const phase1Tables = [
      'model_versions',
      'mv_stations',
      'mv_missions',
      'mv_video_scenes',
      'event_station_overrides',
      'event_mission_overrides',
      'event_graph_nodes',
      'event_graph_edges',
      'render_jobs'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of phase1Tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          existingTables.push(table);
        } else {
          missingTables.push(table);
        }
      } catch (e) {
        missingTables.push(table);
      }
    }

    console.log('📋 Schema Status:');
    console.log(`✅ Existing tables (${existingTables.length}):`, existingTables.join(', '));
    console.log(`❌ Missing tables (${missingTables.length}):`, missingTables.join(', '));

    if (missingTables.length === 0) {
      console.log('🎉 All Phase 1 tables already exist!');
      return await verifySchema();
    }

    // Since we can't execute DDL directly, provide instructions for manual application
    console.log('\n📋 MANUAL SCHEMA APPLICATION INSTRUCTIONS:');
    console.log('=========================================');
    console.log('');
    console.log('Since we cannot execute DDL directly via the Supabase client,');
    console.log('you need to apply the schema using one of these methods:');
    console.log('');
    console.log('🔧 METHOD 1: Supabase Dashboard');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of:');
    console.log('   - phase1-versioning-schema.sql');
    console.log('   - phase1-publishing-rpc.sql');
    console.log('5. Execute each section carefully');
    console.log('');
    console.log('🔧 METHOD 2: psql command line');
    console.log('1. Get your database URL from Supabase dashboard');
    console.log('2. Run: psql "your-db-url" -f phase1-versioning-schema.sql');
    console.log('3. Run: psql "your-db-url" -f phase1-publishing-rpc.sql');
    console.log('');
    console.log('🔧 METHOD 3: Supabase CLI');
    console.log('1. Install: npm install -g @supabase/cli');
    console.log('2. Run: supabase db push');
    console.log('');

    return false;

  } catch (error) {
    console.error('💥 Schema application failed:', error.message);
    return false;
  }
}

async function verifySchema() {
  try {
    console.log('\n🔍 Verifying Phase 1 schema implementation...');

    const checks = [];

    // Test model_versions table structure
    try {
      const { data, error } = await supabase
        .from('model_versions')
        .select('id, model_id, version_number, content_hash, published_at')
        .limit(1);

      checks.push({
        test: 'model_versions table',
        status: !error,
        error: error?.message
      });
    } catch (e) {
      checks.push({
        test: 'model_versions table',
        status: false,
        error: e.message
      });
    }

    // Test mv_stations table structure
    try {
      const { data, error } = await supabase
        .from('mv_stations')
        .select('id, version_id, station_id, display_name')
        .limit(1);

      checks.push({
        test: 'mv_stations table',
        status: !error,
        error: error?.message
      });
    } catch (e) {
      checks.push({
        test: 'mv_stations table',
        status: false,
        error: e.message
      });
    }

    // Test event_station_overrides table structure
    try {
      const { data, error } = await supabase
        .from('event_station_overrides')
        .select('id, event_id, version_id, station_id')
        .limit(1);

      checks.push({
        test: 'event_station_overrides table',
        status: !error,
        error: error?.message
      });
    } catch (e) {
      checks.push({
        test: 'event_station_overrides table',
        status: false,
        error: e.message
      });
    }

    // Test render_jobs table structure
    try {
      const { data, error } = await supabase
        .from('render_jobs')
        .select('id, job_type, status, event_id')
        .limit(1);

      checks.push({
        test: 'render_jobs table',
        status: !error,
        error: error?.message
      });
    } catch (e) {
      checks.push({
        test: 'render_jobs table',
        status: false,
        error: e.message
      });
    }

    // Display results
    console.log('\n📊 Schema Verification Results:');
    console.log('==============================');

    let allPassed = true;
    for (const check of checks) {
      const status = check.status ? '✅' : '❌';
      console.log(`${status} ${check.test}`);
      if (!check.status) {
        console.log(`   Error: ${check.error}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n🎉 Schema verification completed successfully!');
      console.log('✅ All Phase 1 tables are accessible and properly structured');
      return true;
    } else {
      console.log('\n⚠️  Schema verification found issues');
      console.log('🔧 Please apply the missing schema components manually');
      return false;
    }

  } catch (error) {
    console.error('💥 Schema verification failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await applyPhase1Schema();

  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('✅ Phase 1 schema is ready');
    console.log('🔄 You can now test publishing model versions');
    console.log('🏗️  Ready to implement Phase 2 features');
  } else {
    console.log('\n🚧 Action Required:');
    console.log('==================');
    console.log('📋 Please apply the schema manually using the instructions above');
    console.log('🔄 Then run this script again to verify the implementation');
  }
}

if (require.main === module) {
  main();
}