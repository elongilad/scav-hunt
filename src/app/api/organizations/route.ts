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

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Create organization using admin client (bypasses RLS)
    const { data: newOrg, error: orgError } = await adminSupabase
      .from('orgs')
      .insert({
        name,
        owner_user_id: user.id
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Create organization membership using admin client (bypasses RLS)
    const { error: memberError } = await adminSupabase
      .from('org_members')
      .insert({
        org_id: newOrg.id,
        user_id: user.id,
        role: 'owner'
      })

    if (memberError) {
      console.error('Organization membership error:', memberError)
      // Try to clean up the org if membership creation failed
      await adminSupabase.from('orgs').delete().eq('id', newOrg.id)
      return NextResponse.json({ error: 'Failed to create organization membership' }, { status: 500 })
    }

    return NextResponse.json({ organization: newOrg })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}