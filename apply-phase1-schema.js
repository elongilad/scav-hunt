#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  try {
    console.log('🚀 Starting Phase 1 schema application...');

    // Read schema files
    const schemaPath = path.join(__dirname, 'phase1-versioning-schema.sql');
    const rpcPath = path.join(__dirname, 'phase1-publishing-rpc.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    if (!fs.existsSync(rpcPath)) {
      throw new Error(`RPC file not found: ${rpcPath}`);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const rpcSQL = fs.readFileSync(rpcPath, 'utf8');

    console.log('📖 Schema files loaded successfully');
    console.log(`📏 Schema SQL: ${schemaSQL.length} characters`);
    console.log(`📏 RPC SQL: ${rpcSQL.length} characters`);

    // Test connection first
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('orgs')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }

    console.log('✅ Database connection successful');

    // Apply schema in parts to handle dependencies
    const schemaParts = schemaSQL.split('-- ============================================================================');
    const rpcParts = rpcSQL.split('-- ============================================================================');

    console.log(`📦 Found ${schemaParts.length} schema sections`);
    console.log(`📦 Found ${rpcParts.length} RPC sections`);

    // Apply schema sections
    console.log('🔨 Applying schema sections...');
    for (let i = 0; i < schemaParts.length; i++) {
      const part = schemaParts[i].trim();
      if (!part || part.startsWith('--')) continue;

      console.log(`📝 Applying schema section ${i + 1}/${schemaParts.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: part });

      if (error) {
        console.error(`❌ Error in schema section ${i + 1}:`, error.message);
        console.log('📄 Problematic SQL:', part.substring(0, 200) + '...');
        throw error;
      }
    }

    console.log('✅ Schema sections applied successfully');

    // Apply RPC sections
    console.log('🔧 Applying RPC functions...');
    for (let i = 0; i < rpcParts.length; i++) {
      const part = rpcParts[i].trim();
      if (!part || part.startsWith('--')) continue;

      console.log(`📝 Applying RPC section ${i + 1}/${rpcParts.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: part });

      if (error) {
        console.error(`❌ Error in RPC section ${i + 1}:`, error.message);
        console.log('📄 Problematic SQL:', part.substring(0, 200) + '...');
        throw error;
      }
    }

    console.log('✅ RPC functions applied successfully');

    // Verify schema application
    console.log('🔍 Verifying schema application...');

    // Check if model_versions table exists
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'model_versions');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      return;
    }

    if (!tablesData || tablesData.length === 0) {
      console.error('❌ model_versions table not found after application');
      return;
    }

    console.log('✅ model_versions table exists');

    // Check if publish_model_version function exists
    const { data: functionsData, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'publish_model_version');

    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError.message);
      return;
    }

    if (!functionsData || functionsData.length === 0) {
      console.error('❌ publish_model_version function not found after application');
      return;
    }

    console.log('✅ publish_model_version function exists');

    console.log('🎉 Phase 1 schema application completed successfully!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  ✅ Immutable model versioning tables created');
    console.log('  ✅ Event override tables created');
    console.log('  ✅ Graph routing tables created');
    console.log('  ✅ Render jobs table created');
    console.log('  ✅ Publishing RPC functions created');
    console.log('  ✅ Row Level Security policies applied');
    console.log('  ✅ Indexes created for performance');

  } catch (error) {
    console.error('💥 Schema application failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applySchemaDirectly() {
  try {
    console.log('🚀 Starting direct schema application...');

    // Read schema files
    const schemaPath = path.join(__dirname, 'phase1-versioning-schema.sql');
    const rpcPath = path.join(__dirname, 'phase1-publishing-rpc.sql');

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const rpcSQL = fs.readFileSync(rpcPath, 'utf8');

    console.log('📖 Schema files loaded');

    // Split SQL into individual statements
    const allSQL = schemaSQL + '\n\n' + rpcSQL;
    const statements = allSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    console.log(`📦 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.log('📄 Statement:', statement.substring(0, 100) + '...');
          // Continue with next statement for non-critical errors
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log('⚠️  Continuing with next statement...');
            continue;
          }
          throw error;
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.error(`💥 Fatal error in statement ${i + 1}:`, stmtError.message);
        throw stmtError;
      }
    }

    console.log('🎉 Direct schema application completed!');

  } catch (error) {
    console.error('💥 Direct schema application failed:', error.message);
    throw error;
  }
}

// Run the application
async function main() {
  try {
    await applySchemaDirectly();
  } catch (error) {
    console.error('💥 Schema application failed completely:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { applySchema, applySchemaDirectly };