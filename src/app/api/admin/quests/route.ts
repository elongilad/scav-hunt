import { NextRequest, NextResponse } from 'next/server'
import { getUserAndOrg } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const questData = await req.json()

    const {
      name,
      description,
      theme,
      age_min,
      age_max,
      duration_min,
      cover_image_url,
      stations,
      missions
    } = questData

    // Validate required fields
    if (!name || !description || !theme || stations.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the hunt model
    const { data: huntModel, error: huntModelError } = await adminSupabase
      .from('hunt_models')
      .insert({
        org_id: org.id,
        name,
        description,
        locale: 'en',
        active: true,
        published: false,
        duration_min,
        age_min,
        age_max,
        cover_image_url
      })
      .select()
      .single()

    if (huntModelError) {
      console.error('Error creating hunt model:', huntModelError)
      return NextResponse.json(
        { error: 'Failed to create quest template' },
        { status: 500 }
      )
    }

    const modelId = huntModel.id

    // Create stations
    if (stations.length > 0) {
      const stationData = stations.map((station: any) => ({
        id: station.id,
        model_id: modelId,
        display_name: station.display_name,
        type: station.type,
        default_activity: {
          description: station.activity_description,
          props_needed: station.props_needed || [],
          estimated_duration: station.estimated_duration || 10,
          sequence: station.sequence || 1
        }
      }))

      const { error: stationsError } = await adminSupabase
        .from('model_stations')
        .insert(stationData)

      if (stationsError) {
        console.error('Error creating stations:', stationsError)
        // Try to clean up the hunt model
        await adminSupabase.from('hunt_models').delete().eq('id', modelId)
        return NextResponse.json(
          { error: 'Failed to create quest stations' },
          { status: 500 }
        )
      }
    }

    // Create missions
    if (missions.length > 0) {
      const missionData = missions.map((mission: any) => ({
        model_id: modelId,
        to_station_id: mission.to_station_id,
        title: mission.title,
        clue: mission.clue,
        locale: 'en',
        active: mission.active !== false
      }))

      const { error: missionsError } = await adminSupabase
        .from('model_missions')
        .insert(missionData)

      if (missionsError) {
        console.error('Error creating missions:', missionsError)
        // Try to clean up (missions will cascade delete with hunt model)
        await adminSupabase.from('hunt_models').delete().eq('id', modelId)
        return NextResponse.json(
          { error: 'Failed to create quest missions' },
          { status: 500 }
        )
      }
    }

    console.log(`✅ Created quest template: ${name} (${modelId})`)

    return NextResponse.json({
      success: true,
      questId: modelId,
      message: 'Quest template created successfully'
    })

  } catch (error) {
    console.error('Quest creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, org } = await getUserAndOrg()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Get all quest templates for this org
    const { data: quests, error } = await adminSupabase
      .from('hunt_models')
      .select(`
        id,
        name,
        description,
        locale,
        active,
        published,
        duration_min,
        age_min,
        age_max,
        cover_image_url,
        created_at,
        model_stations (
          id,
          display_name,
          type,
          default_activity
        ),
        model_missions (
          id,
          title,
          clue,
          to_station_id,
          active
        )
      `)
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quest templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quests: quests || []
    })

  } catch (error) {
    console.error('Quest fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}