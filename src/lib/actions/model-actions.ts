'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { z } from 'zod'

const publishModelSchema = z.object({
  huntModelId: z.string().uuid(),
  isActive: z.boolean().default(true)
})

const instantiateEventSchema = z.object({
  modelVersionId: z.string().uuid(),
  title: z.string().min(1),
  locale: z.string().default('he')
})

const compileEventSchema = z.object({
  eventId: z.string().uuid()
})

export async function publishModelVersion(input: z.infer<typeof publishModelSchema>) {
  try {
    const user = await requireAuth()
    const { huntModelId, isActive } = publishModelSchema.parse(input)

    const supabase = createAdminClient()

    // Get hunt model to check org access
    const { data: huntModel } = await supabase
      .from('hunt_models')
      .select('org_id')
      .eq('id', huntModelId)
      .single()

    if (!huntModel) {
      throw new Error('Hunt model not found')
    }

    await requireOrgAccess(huntModel.org_id, 'editor')

    // Get stations and missions for this model
    const [stationsResult, missionsResult] = await Promise.all([
      supabase
        .from('model_stations')
        .select('*')
        .eq('model_id', huntModelId)
        .order('created_at'),
      supabase
        .from('model_missions')
        .select('*')
        .eq('model_id', huntModelId)
        .order('created_at')
    ])

    const stations = stationsResult.data || []
    const missions = missionsResult.data || []

    // Models can be published without stations for marketplace templates
    // Stations and missions will be added when instantiating events

    // Generate content hash
    const contentString = JSON.stringify({
      model_id: huntModelId,
      stations: stations.map(s => ({
        id: s.id,
        display_name: s.display_name,
        type: s.type,
        default_activity: s.default_activity
      })).sort((a, b) => a.id.localeCompare(b.id)),
      missions: missions.map(m => ({
        id: m.id,
        to_station_id: m.to_station_id,
        title: m.title,
        clue: m.clue
      })).sort((a, b) => a.id.localeCompare(b.id))
    })

    // Simple hash function (in production, use crypto.createHash)
    const contentHash = Buffer.from(contentString).toString('base64').slice(0, 32)

    // Get next version number
    const { data: latestVersion } = await supabase
      .from('model_versions')
      .select('version_number')
      .eq('model_id', huntModelId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (latestVersion?.version_number || 0) + 1

    // Create model version
    const { data: modelVersion, error: versionError } = await supabase
      .from('model_versions')
      .insert({
        model_id: huntModelId,
        version_number: nextVersionNumber,
        content_hash: contentHash,
        is_published: true,
        is_active: isActive,
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (versionError || !modelVersion) {
      throw new Error(`Failed to create model version: ${versionError?.message}`)
    }

    // Update the hunt model to be published in catalog
    const { error: publishError } = await supabase
      .from('hunt_models')
      .update({ published: true })
      .eq('id', huntModelId)

    if (publishError) {
      throw new Error(`Failed to publish model to catalog: ${publishError?.message}`)
    }

    // Create station snapshots
    if (stations.length > 0) {
      const stationSnapshots = stations.map((station, index) => ({
        version_id: modelVersion.id,
        station_id: station.id,
        display_name: station.display_name,
        station_type: station.type,
        default_activity: station.default_activity,
        snapshot_order: index
      }))

      const { error: stationsError } = await supabase
        .from('mv_stations')
        .insert(stationSnapshots)

      if (stationsError) {
        throw new Error(`Failed to create station snapshots: ${stationsError.message}`)
      }
    }

    // Create mission snapshots
    if (missions.length > 0) {
      const missionSnapshots = missions.map((mission, index) => ({
        version_id: modelVersion.id,
        mission_id: mission.id,
        to_station_id: mission.to_station_id,
        title: mission.title,
        clue: mission.clue,
        video_template_id: mission.video_template_id,
        overlay_spec: mission.overlay_spec,
        locale: mission.locale || 'he',
        snapshot_order: index
      }))

      const { error: missionsError } = await supabase
        .from('mv_missions')
        .insert(missionSnapshots)

      if (missionsError) {
        throw new Error(`Failed to create mission snapshots: ${missionsError.message}`)
      }
    }

    revalidatePath(`/admin/models/${huntModelId}`)
    revalidatePath('/admin/models')

    return {
      success: true,
      versionId: modelVersion.id,
      versionNumber: nextVersionNumber,
      stationsCount: stations.length,
      missionsCount: missions.length
    }

  } catch (error) {
    console.error('Error publishing model version:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function instantiateEvent(input: z.infer<typeof instantiateEventSchema>) {
  try {
    const user = await requireAuth()
    const { modelVersionId, title, locale } = instantiateEventSchema.parse(input)

    const supabase = createAdminClient()

    // Get model version with hunt model info
    const { data: modelVersion } = await supabase
      .from('model_versions')
      .select(`
        *,
        hunt_models (org_id, name)
      `)
      .eq('id', modelVersionId)
      .single()

    if (!modelVersion) {
      throw new Error('Model version not found')
    }

    await requireOrgAccess(modelVersion.hunt_models.org_id, 'editor')

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title,
        locale,
        org_id: modelVersion.hunt_models.org_id,
        buyer_user_id: user.id,
        model_version_id: modelVersionId,
        status: 'draft'
      })
      .select()
      .single()

    if (eventError || !event) {
      throw new Error(`Failed to create event: ${eventError?.message}`)
    }

    // Get stations and missions from version snapshots
    const [stationsResult, missionsResult] = await Promise.all([
      supabase
        .from('mv_stations')
        .select('*')
        .eq('version_id', modelVersionId)
        .order('snapshot_order'),
      supabase
        .from('mv_missions')
        .select('*')
        .eq('version_id', modelVersionId)
        .order('snapshot_order')
    ])

    const stations = stationsResult.data || []
    const missions = missionsResult.data || []

    // Create station overrides (initially disabled)
    if (stations.length > 0) {
      const stationOverrides = stations.map(station => ({
        event_id: event.id,
        version_id: modelVersionId,
        station_id: station.station_id,
        enabled_override: false,
        override_display_name: null,
        override_activity: null
      }))

      const { error: overridesError } = await supabase
        .from('event_station_overrides')
        .insert(stationOverrides)

      if (overridesError) {
        throw new Error(`Failed to create station overrides: ${overridesError.message}`)
      }
    }

    // Create mission overrides (initially disabled)
    if (missions.length > 0) {
      const missionOverrides = missions.map(mission => ({
        event_id: event.id,
        version_id: modelVersionId,
        mission_id: mission.mission_id,
        enabled_override: false,
        override_title: null,
        override_clue: null,
        override_video_template_id: null
      }))

      const { error: missionOverridesError } = await supabase
        .from('event_mission_overrides')
        .insert(missionOverrides)

      if (missionOverridesError) {
        throw new Error(`Failed to create mission overrides: ${missionOverridesError.message}`)
      }
    }

    // Create basic graph nodes and edges
    const graphNodes = []
    const graphEdges = []

    // Create station nodes
    for (const station of stations) {
      graphNodes.push({
        event_id: event.id,
        version_id: modelVersionId,
        node_type: 'station',
        node_ref_id: station.station_id,
        node_label: station.display_name,
        node_order: station.snapshot_order
      })
    }

    // Create mission nodes and edges
    for (const mission of missions) {
      const missionNodeId = `mission_${mission.mission_id}`
      graphNodes.push({
        event_id: event.id,
        version_id: modelVersionId,
        node_type: 'mission',
        node_ref_id: mission.mission_id,
        node_label: mission.title || `Mission to ${mission.to_station_id}`,
        node_order: mission.snapshot_order + 1000 // Offset missions after stations
      })
    }

    if (graphNodes.length > 0) {
      const { error: nodesError } = await supabase
        .from('event_graph_nodes')
        .insert(graphNodes)

      if (nodesError) {
        throw new Error(`Failed to create graph nodes: ${nodesError.message}`)
      }
    }

    revalidatePath('/admin/events')
    revalidatePath(`/admin/models/${modelVersion.model_id}`)

    return {
      success: true,
      eventId: event.id,
      eventTitle: title,
      stationsCount: stations.length,
      missionsCount: missions.length
    }

  } catch (error) {
    console.error('Error instantiating event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function compileEvent(input: z.infer<typeof compileEventSchema>) {
  try {
    const user = await requireAuth()
    const { eventId } = compileEventSchema.parse(input)

    const supabase = createAdminClient()

    // Get event with org info
    const { data: event } = await supabase
      .from('events')
      .select('org_id, title, model_version_id')
      .eq('id', eventId)
      .single()

    if (!event) {
      throw new Error('Event not found')
    }

    await requireOrgAccess(event.org_id, 'editor')

    // Get missions for this event
    const { data: missions } = await supabase
      .from('mv_missions')
      .select('mission_id, title, to_station_id')
      .eq('version_id', event.model_version_id)

    if (!missions || missions.length === 0) {
      throw new Error('No missions found for this event')
    }

    // Create render jobs for each mission
    const renderJobs = missions.map(mission => ({
      org_id: event.org_id,
      event_id: eventId,
      job_type: 'mission_video',
      status: 'pending',
      priority: 100,
      input_spec: {
        mission_id: mission.mission_id,
        event_id: eventId
      },
      output_spec: {
        format: 'mp4',
        resolution: '1920x1080'
      },
      queued_at: new Date().toISOString()
    }))

    const { data: createdJobs, error: jobsError } = await supabase
      .from('render_jobs')
      .upsert(renderJobs, {
        onConflict: 'org_id,event_id,job_type,input_spec',
        ignoreDuplicates: true
      })
      .select()

    if (jobsError) {
      throw new Error(`Failed to create render jobs: ${jobsError.message}`)
    }

    revalidatePath(`/admin/events/${eventId}`)

    return {
      success: true,
      jobsCreated: createdJobs?.length || 0,
      missionsProcessed: missions.length
    }

  } catch (error) {
    console.error('Error compiling event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}