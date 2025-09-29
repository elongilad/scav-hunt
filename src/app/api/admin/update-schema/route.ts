import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Execute SQL to add missing columns to model_stations
    const alterTableSQL = `
      DO $$
      BEGIN
        -- Add station_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='model_stations' AND column_name='station_id') THEN
          ALTER TABLE model_stations ADD COLUMN station_id text;
        END IF;

        -- Add station_type column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='model_stations' AND column_name='station_type') THEN
          ALTER TABLE model_stations ADD COLUMN station_type text;
        END IF;

        -- Add activity_description column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='model_stations' AND column_name='activity_description') THEN
          ALTER TABLE model_stations ADD COLUMN activity_description text;
        END IF;

        -- Add props_needed column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='model_stations' AND column_name='props_needed') THEN
          ALTER TABLE model_stations ADD COLUMN props_needed text[];
        END IF;

        -- Update station_type from type column for existing data
        UPDATE model_stations SET station_type = type WHERE station_type IS NULL AND type IS NOT NULL;
      END $$;
    `;

    const { error } = await supabase.rpc('execute_sql', { query: alterTableSQL });

    if (error) {
      console.error('❌ Schema update error:', error);
      return NextResponse.json({ error: 'Failed to update schema', details: error }, { status: 500 });
    }

    console.log('✅ Schema updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Schema updated successfully'
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}