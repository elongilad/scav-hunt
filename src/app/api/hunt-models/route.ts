import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get current user from regular client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { org_id, name, description, locale, active } = await request.json()

    if (!org_id || !name) {
      return NextResponse.json({ error: 'Organization ID and name are required' }, { status: 400 })
    }

    // Verify user has access to this organization (using admin client to avoid RLS issues)
    const { data: membership } = await adminSupabase
      .from('org_members')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create hunt model using admin client (bypasses RLS)
    const { data: huntModel, error: modelError } = await adminSupabase
      .from('hunt_models')
      .insert({
        org_id,
        name: name.trim(),
        description: description?.trim() || null,
        locale,
        active
      })
      .select()
      .single()

    if (modelError) {
      console.error('Hunt model creation error:', modelError)
      return NextResponse.json({ error: 'Failed to create hunt model' }, { status: 500 })
    }

    return NextResponse.json({ huntModel })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}