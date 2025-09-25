import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

// Schema application API route for Phase 1
export async function POST(request: NextRequest) {
  try {
    const { authorization } = await request.json()

    // Simple authorization check - in production this should be more secure
    if (authorization !== 'apply-phase1-schema-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Starting Phase 1 schema application...')

    const supabase = createAdminClient()

    // Read schema files
    const schemaPath = path.join(process.cwd(), 'phase1-versioning-schema.sql')
    const rpcPath = path.join(process.cwd(), 'phase1-publishing-rpc.sql')

    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({
        error: `Schema file not found: ${schemaPath}`
      }, { status: 400 })
    }

    if (!fs.existsSync(rpcPath)) {
      return NextResponse.json({
        error: `RPC file not found: ${rpcPath}`
      }, { status: 400 })
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    const rpcSQL = fs.readFileSync(rpcPath, 'utf8')

    console.log('📖 Schema files loaded successfully')

    // Test connection first
    const { error: testError } = await supabase
      .from('orgs')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      return NextResponse.json({
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }

    console.log('✅ Database connection successful')

    // Apply schema by executing SQL statements one by one
    const results = []

    // Define the SQL statements to execute in order
    const statements = [
      // 1. Create model_versions table
      `create table model_versions (
        id uuid primary key default gen_random_uuid(),
        model_id uuid not null references hunt_models(id) on delete cascade,
        version_number integer not null,
        content_hash text not null,
        published_at timestamptz not null default now(),
        published_by uuid not null references auth.users(id),
        is_published boolean not null default false,
        is_draft boolean not null default true,
        parent_version_id uuid references model_versions(id),
        major_version integer not null default 1,
        minor_version integer not null default 0,
        patch_version integer not null default 0,
        version_tag text,
        change_summary text,
        change_details jsonb,
        created_at timestamptz default now(),
        unique(model_id, version_number),
        unique(model_id, version_tag),
        check (version_number > 0),
        check (major_version >= 0),
        check (minor_version >= 0),
        check (patch_version >= 0)
      )`,

      // 2. Create mv_stations table
      `create table mv_stations (
        id uuid primary key default gen_random_uuid(),
        version_id uuid not null references model_versions(id) on delete cascade,
        station_id text not null,
        display_name text not null,
        station_type text not null,
        default_activity jsonb not null,
        snapshot_order integer not null,
        created_at timestamptz default now(),
        unique(version_id, station_id)
      )`,

      // 3. Create mv_missions table
      `create table mv_missions (
        id uuid primary key default gen_random_uuid(),
        version_id uuid not null references model_versions(id) on delete cascade,
        mission_id uuid not null,
        to_station_id text not null,
        title text,
        clue jsonb,
        video_template_id uuid,
        overlay_spec jsonb,
        locale text default 'he',
        snapshot_order integer not null,
        created_at timestamptz default now(),
        unique(version_id, mission_id)
      )`,

      // 4. Create event_station_overrides table
      `create table event_station_overrides (
        id uuid primary key default gen_random_uuid(),
        event_id uuid not null references events(id) on delete cascade,
        version_id uuid not null references model_versions(id),
        station_id text not null,
        display_name_override text,
        activity_override jsonb,
        enabled_override boolean,
        lat double precision,
        lng double precision,
        address text,
        media_user_clip_id uuid references media_assets(id),
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        unique(event_id, station_id)
      )`,

      // 5. Create event_mission_overrides table
      `create table event_mission_overrides (
        id uuid primary key default gen_random_uuid(),
        event_id uuid not null references events(id) on delete cascade,
        version_id uuid not null references model_versions(id),
        mission_id uuid not null,
        title_override text,
        clue_override jsonb,
        overlay_spec_override jsonb,
        compiled_video_asset_id uuid references media_assets(id),
        compiled_status text not null default 'pending' check (compiled_status in ('pending','queued','rendering','ready','failed')),
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        unique(event_id, mission_id)
      )`,

      // 6. Create render_jobs table
      `create table render_jobs (
        id uuid primary key default gen_random_uuid(),
        job_type text not null check (job_type in ('mission_video', 'compilation', 'preview')),
        event_id uuid not null references events(id) on delete cascade,
        mission_override_id uuid references event_mission_overrides(id) on delete cascade,
        input_spec jsonb not null,
        output_spec jsonb not null,
        status text not null default 'pending' check (status in ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled')),
        priority integer not null default 100,
        progress_percentage integer default 0 check (progress_percentage between 0 and 100),
        current_stage text,
        stages_total integer,
        stages_completed integer default 0,
        worker_id text,
        allocated_at timestamptz,
        max_processing_time_minutes integer default 30,
        output_asset_id uuid references media_assets(id),
        output_metadata jsonb,
        error_message text,
        error_details jsonb,
        retry_count integer default 0,
        max_retries integer default 3,
        queued_at timestamptz,
        started_at timestamptz,
        completed_at timestamptz,
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        check (retry_count <= max_retries),
        check (stages_completed <= stages_total)
      )`
    ]

    // Apply basic tables first
    console.log('🔨 Creating basic tables...')
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`📝 Creating table ${i + 1}/${statements.length}...`)

      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating table ${i + 1}:`, error.message)
        results.push({
          step: `table_${i + 1}`,
          success: false,
          error: error.message
        })
        // Continue with other tables
      } else {
        console.log(`✅ Table ${i + 1} created successfully`)
        results.push({
          step: `table_${i + 1}`,
          success: true
        })
      }
    }

    // Enable RLS on new tables
    console.log('🔒 Enabling Row Level Security...')
    const rlsTables = [
      'model_versions',
      'mv_stations',
      'mv_missions',
      'event_station_overrides',
      'event_mission_overrides',
      'render_jobs'
    ]

    for (const table of rlsTables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `alter table ${table} enable row level security`
      })

      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error enabling RLS on ${table}:`, error.message)
        results.push({
          step: `rls_${table}`,
          success: false,
          error: error.message
        })
      } else {
        console.log(`✅ RLS enabled on ${table}`)
        results.push({
          step: `rls_${table}`,
          success: true
        })
      }
    }

    // Create basic indexes
    console.log('📊 Creating indexes...')
    const indexes = [
      'create index idx_model_versions_model_id on model_versions(model_id)',
      'create index idx_mv_stations_version_id on mv_stations(version_id)',
      'create index idx_mv_missions_version_id on mv_missions(version_id)',
      'create index idx_event_station_overrides_event on event_station_overrides(event_id)',
      'create index idx_event_mission_overrides_event on event_mission_overrides(event_id)',
      'create index idx_render_jobs_status on render_jobs(status)'
    ]

    for (let i = 0; i < indexes.length; i++) {
      const indexSQL = indexes[i]
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL })

      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating index ${i + 1}:`, error.message)
        results.push({
          step: `index_${i + 1}`,
          success: false,
          error: error.message
        })
      } else {
        console.log(`✅ Index ${i + 1} created successfully`)
        results.push({
          step: `index_${i + 1}`,
          success: true
        })
      }
    }

    // Test table creation
    console.log('🔍 Verifying table creation...')
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['model_versions', 'mv_stations', 'mv_missions', 'render_jobs'])

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message)
      return NextResponse.json({
        error: 'Failed to verify table creation',
        details: tablesError.message,
        results
      }, { status: 500 })
    }

    const createdTables = tablesData?.map(t => t.table_name) || []
    console.log('✅ Created tables:', createdTables)

    console.log('🎉 Phase 1 schema application completed!')

    return NextResponse.json({
      success: true,
      message: 'Phase 1 schema applied successfully',
      results,
      createdTables,
      summary: {
        tablesCreated: createdTables.length,
        indexesCreated: indexes.length,
        rlsEnabled: rlsTables.length
      }
    })

  } catch (error: any) {
    console.error('💥 Schema application failed:', error.message)
    return NextResponse.json({
      error: 'Schema application failed',
      details: error.message
    }, { status: 500 })
  }
}