#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

async function applyRenderJobsFix() {
  try {
    console.log('🔧 Applying render_jobs table fix...');

    // Read the SQL file
    const sqlContent = fs.readFileSync('./fix-render-jobs.sql', 'utf8');

    console.log('📋 SQL fix to apply:');
    console.log('====================');
    console.log('');
    console.log('Since we cannot execute DDL directly, please apply this SQL manually:');
    console.log('');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the following SQL:');
    console.log('');
    console.log('-- BEGIN RENDER JOBS FIX --');
    console.log(sqlContent);
    console.log('-- END RENDER JOBS FIX --');
    console.log('');
    console.log('5. Click "Run" to execute');
    console.log('');
    console.log('⚠️  IMPORTANT: This will add missing columns to the render_jobs table');
    console.log('✅ After applying, run: node apply-schema-manual.js to verify');

    return true;

  } catch (error) {
    console.error('💥 Failed to read fix file:', error.message);
    return false;
  }
}

if (require.main === module) {
  applyRenderJobsFix();
}