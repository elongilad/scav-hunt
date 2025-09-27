import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Use admin client to bypass RLS entirely
    const supabase = createAdminClient()

    // Check if we can read hunt_models at all
    const { data: allModels, error: allError } = await supabase
      .from('hunt_models')
      .select('id, name, published, active')

    // Check specifically for published models
    const { data: publishedModels, error: publishedError } = await supabase
      .from('hunt_models')
      .select('id, name, description')
      .eq('published', true)

    return NextResponse.json({
      allModels: allModels || null,
      allError: allError?.message || null,
      publishedModels: publishedModels || null,
      publishedError: publishedError?.message || null,
      debug: {
        timestamp: new Date().toISOString(),
        userContext: 'debug-catalog-admin',
        totalModels: allModels?.length || 0,
        publishedCount: publishedModels?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}