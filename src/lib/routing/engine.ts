import { createClient } from '@/lib/supabase/client'
import { VideoRenderer } from '@/lib/video/renderer'

export interface Team {
  id: string
  event_id: string
  name: string
  participants: string[]
  status: 'active' | 'completed' | 'inactive'
  current_station_id?: string
  completion_time?: string
  score: number
  created_at: string
  updated_at: string
}

export interface Station {
  id: string
  station_id: string
  display_name: string
  station_type: string
  activity_description: string
  props_needed: string[]
  estimated_duration: number
  difficulty_level: number
}

export interface Mission {
  id: string
  to_station_id: string
  title?: string
  clue: any
  video_template_id?: string
  overlay_spec?: any
  locale: string
  active: boolean
}

export interface TeamProgress {
  team_id: string
  station_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  start_time?: string
  completion_time?: string
  score_earned: number
  user_clips: string[]
  notes?: string
}

export interface RouteDecision {
  next_station_id?: string
  mission?: Mission
  completion_status: 'continue' | 'completed' | 'blocked'
  estimated_remaining_time?: number
  message?: string
}

export class RoutingEngine {
  private supabase = createClient()
  private videoRenderer = new VideoRenderer()
  
  constructor() {}

  /**
   * Get the next station for a team based on their current progress
   */
  async getNextStation(teamId: string, currentStationId?: string): Promise<RouteDecision> {
    try {
      // Load team and event data
      const team = await this.loadTeam(teamId)
      if (!team) throw new Error('Team not found')

      const stations = await this.loadEventStations(team.event_id)
      const missions = await this.loadEventMissions(team.event_id)
      const progress = await this.loadTeamProgress(teamId)

      // Check if hunt is completed
      const completedStations = progress.filter(p => p.status === 'completed')
      const isHuntCompleted = completedStations.length >= stations.length

      if (isHuntCompleted) {
        // Trigger video rendering if not already done
        await this.triggerVideoRendering(team, completedStations)
        
        return {
          completion_status: 'completed',
          message: 'מזל טוב! השלמתם את הציד בהצלחה! הוידאו שלכם מוכן.'
        }
      }

      // Find next available station
      const nextStation = await this.findOptimalNextStation(
        team,
        stations,
        missions,
        progress,
        currentStationId
      )

      if (!nextStation) {
        return {
          completion_status: 'blocked',
          message: 'לא נמצאו עמדות זמינות כרגע. אנא פנו למארגנים.'
        }
      }

      // Find mission to this station
      const mission = missions.find(m => m.to_station_id === nextStation.station_id && m.active)

      // Calculate estimated remaining time
      const remainingStations = stations.filter(s => 
        !completedStations.some(p => p.station_id === s.station_id)
      )
      const estimatedTime = remainingStations.reduce((sum, s) => sum + s.estimated_duration, 0)

      return {
        next_station_id: nextStation.station_id,
        mission,
        completion_status: 'continue',
        estimated_remaining_time: estimatedTime,
        message: mission ? undefined : 'המשיכו לעמדה הבאה'
      }

    } catch (error) {
      console.error('Error in routing engine:', error)
      return {
        completion_status: 'blocked',
        message: 'שגיאה במערכת הניווט. אנא פנו למארגנים.'
      }
    }
  }

  /**
   * Mark a station as completed for a team
   */
  async completeStation(
    teamId: string, 
    stationId: string, 
    scoreEarned: number = 0,
    userClips: string[] = [],
    notes?: string
  ): Promise<void> {
    try {
      // Update or create progress record
      const { error: progressError } = await this.supabase
        .from('team_progress')
        .upsert({
          team_id: teamId,
          station_id: stationId,
          status: 'completed',
          completion_time: new Date().toISOString(),
          score_earned: scoreEarned,
          user_clips: userClips,
          notes: notes
        })

      if (progressError) throw progressError

      // Update team's total score
      const { data: currentProgress } = await this.supabase
        .from('team_progress')
        .select('score_earned')
        .eq('team_id', teamId)
        .eq('status', 'completed')

      const totalScore = currentProgress?.reduce((sum, p) => sum + (p.score_earned || 0), 0) || 0

      const { error: teamError } = await this.supabase
        .from('teams')
        .update({ 
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)

      if (teamError) throw teamError

      // Check if this was the last station
      const team = await this.loadTeam(teamId)
      if (team) {
        const stations = await this.loadEventStations(team.event_id)
        const progress = await this.loadTeamProgress(teamId)
        const completedCount = progress.filter(p => p.status === 'completed').length

        if (completedCount >= stations.length) {
          // Mark team as completed
          await this.supabase
            .from('teams')
            .update({
              status: 'completed',
              completion_time: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', teamId)
        }
      }

    } catch (error) {
      console.error('Error completing station:', error)
      throw error
    }
  }

  /**
   * Start a station for a team
   */
  async startStation(teamId: string, stationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_progress')
        .upsert({
          team_id: teamId,
          station_id: stationId,
          status: 'in_progress',
          start_time: new Date().toISOString(),
          score_earned: 0,
          user_clips: []
        })

      if (error) throw error

      // Update team's current station
      await this.supabase
        .from('teams')
        .update({ 
          current_station_id: stationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)

    } catch (error) {
      console.error('Error starting station:', error)
      throw error
    }
  }

  /**
   * Skip a station (if allowed by event rules)
   */
  async skipStation(teamId: string, stationId: string, reason?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_progress')
        .upsert({
          team_id: teamId,
          station_id: stationId,
          status: 'skipped',
          completion_time: new Date().toISOString(),
          score_earned: 0,
          user_clips: [],
          notes: reason
        })

      if (error) throw error

    } catch (error) {
      console.error('Error skipping station:', error)
      throw error
    }
  }

  /**
   * Get team's current progress overview
   */
  async getTeamProgress(teamId: string): Promise<{
    team: Team,
    progress: TeamProgress[],
    currentStation?: Station,
    nextStation?: Station,
    completionPercentage: number,
    estimatedTimeRemaining: number
  }> {
    try {
      const team = await this.loadTeam(teamId)
      if (!team) throw new Error('Team not found')

      const stations = await this.loadEventStations(team.event_id)
      const progress = await this.loadTeamProgress(teamId)

      const completedCount = progress.filter(p => p.status === 'completed').length
      const completionPercentage = Math.round((completedCount / stations.length) * 100)

      const currentStation = team.current_station_id 
        ? stations.find(s => s.station_id === team.current_station_id)
        : undefined

      const routeDecision = await this.getNextStation(teamId, team.current_station_id)
      const nextStation = routeDecision.next_station_id
        ? stations.find(s => s.station_id === routeDecision.next_station_id)
        : undefined

      const remainingStations = stations.filter(s => 
        !progress.some(p => p.station_id === s.station_id && p.status === 'completed')
      )
      const estimatedTimeRemaining = remainingStations.reduce((sum, s) => sum + s.estimated_duration, 0)

      return {
        team,
        progress,
        currentStation,
        nextStation,
        completionPercentage,
        estimatedTimeRemaining
      }

    } catch (error) {
      console.error('Error getting team progress:', error)
      throw error
    }
  }

  /**
   * Get event leaderboard
   */
  async getEventLeaderboard(eventId: string): Promise<{
    team: Team,
    completedStations: number,
    totalScore: number,
    completionTime?: string,
    rank: number
  }[]> {
    try {
      const { data: teams } = await this.supabase
        .from('teams')
        .select(`
          *,
          team_progress (
            station_id,
            status,
            score_earned,
            completion_time
          )
        `)
        .eq('event_id', eventId)
        .order('score', { ascending: false })

      if (!teams) return []

      const leaderboard = teams.map((team, index) => {
        const progress = (team as any).team_progress || []
        const completedStations = progress.filter((p: any) => p.status === 'completed').length
        const totalScore = progress.reduce((sum: number, p: any) => sum + (p.score_earned || 0), 0)

        return {
          team: {
            id: team.id,
            event_id: team.event_id,
            name: team.name,
            participants: team.participants,
            status: team.status,
            current_station_id: team.current_station_id,
            completion_time: team.completion_time,
            score: team.score,
            created_at: team.created_at,
            updated_at: team.updated_at
          },
          completedStations,
          totalScore,
          completionTime: team.completion_time,
          rank: index + 1
        }
      })

      // Sort by completion status, then score, then completion time
      return leaderboard.sort((a, b) => {
        if (a.team.status === 'completed' && b.team.status !== 'completed') return -1
        if (b.team.status === 'completed' && a.team.status !== 'completed') return 1
        if (a.totalScore !== b.totalScore) return b.totalScore - a.totalScore
        if (a.completionTime && b.completionTime) {
          return new Date(a.completionTime).getTime() - new Date(b.completionTime).getTime()
        }
        return 0
      }).map((entry, index) => ({ ...entry, rank: index + 1 }))

    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  /**
   * Find the optimal next station for a team
   */
  private async findOptimalNextStation(
    team: Team,
    stations: Station[],
    missions: Mission[],
    progress: TeamProgress[],
    currentStationId?: string
  ): Promise<Station | null> {
    // Get completed station IDs
    const completedStationIds = progress
      .filter(p => p.status === 'completed')
      .map(p => p.station_id)

    // Get available stations (not completed)
    const availableStations = stations.filter(s => 
      !completedStationIds.includes(s.station_id)
    )

    if (availableStations.length === 0) return null

    // Simple routing strategy - return first available station
    // In a more sophisticated system, this could consider:
    // - Station dependencies
    // - Optimal path algorithms
    // - Team preferences
    // - Physical location optimization
    // - Difficulty progression

    // Prefer stations with active missions
    const stationsWithMissions = availableStations.filter(s =>
      missions.some(m => m.to_station_id === s.station_id && m.active)
    )

    if (stationsWithMissions.length > 0) {
      // Sort by difficulty level for progressive difficulty
      return stationsWithMissions.sort((a, b) => a.difficulty_level - b.difficulty_level)[0]
    }

    // Fallback to any available station
    return availableStations.sort((a, b) => a.difficulty_level - b.difficulty_level)[0]
  }

  /**
   * Trigger video rendering when team completes hunt
   */
  private async triggerVideoRendering(team: Team, completedProgress: TeamProgress[]): Promise<void> {
    try {
      // Check if render job already exists
      const existingJobs = await this.videoRenderer.getEventRenderJobs(team.event_id)
      const teamJob = existingJobs.find(job => 
        job.team_id === team.id && 
        (job.status === 'completed' || job.status === 'processing' || job.status === 'pending')
      )

      if (teamJob) {
        console.log(`Render job already exists for team ${team.id}`)
        return
      }

      // Get video template for the event
      const { data: event } = await this.supabase
        .from('events')
        .select(`
          id,
          hunt_models (
            video_template_id
          )
        `)
        .eq('id', team.event_id)
        .single()

      const videoTemplateId = (event as any)?.hunt_models?.video_template_id
      if (!videoTemplateId) {
        console.log(`No video template found for event ${team.event_id}`)
        return
      }

      // Collect user clips from completed stations
      const userClips = completedProgress
        .filter(p => p.user_clips && p.user_clips.length > 0)
        .flatMap(p => p.user_clips.map(clipPath => ({
          id: `${p.team_id}-${p.station_id}`,
          file_path: clipPath,
          duration_ms: 5000, // Default duration, should be extracted from file
          station_id: p.station_id,
          timestamp: p.completion_time || new Date().toISOString()
        })))

      if (userClips.length === 0) {
        console.log(`No user clips found for team ${team.id}`)
        return
      }

      // Create render job
      await this.videoRenderer.createRenderJob(
        team.event_id,
        team.id,
        videoTemplateId,
        userClips
      )

      console.log(`Video rendering triggered for team ${team.id}`)

    } catch (error) {
      console.error('Error triggering video rendering:', error)
    }
  }

  /**
   * Load team data
   */
  private async loadTeam(teamId: string): Promise<Team | null> {
    try {
      const { data: team, error } = await this.supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (error) throw error
      return team
    } catch (error) {
      console.error('Error loading team:', error)
      return null
    }
  }

  /**
   * Load stations for an event
   */
  private async loadEventStations(eventId: string): Promise<Station[]> {
    try {
      const { data: event } = await this.supabase
        .from('events')
        .select('model_id')
        .eq('id', eventId)
        .single()

      if (!event) return []

      const { data: stations, error } = await this.supabase
        .from('model_stations')
        .select('*')
        .eq('model_id', event.model_id)
        .order('station_id')

      if (error) throw error
      return stations || []
    } catch (error) {
      console.error('Error loading event stations:', error)
      return []
    }
  }

  /**
   * Load missions for an event
   */
  private async loadEventMissions(eventId: string): Promise<Mission[]> {
    try {
      const { data: event } = await this.supabase
        .from('events')
        .select('model_id')
        .eq('id', eventId)
        .single()

      if (!event) return []

      const { data: missions, error } = await this.supabase
        .from('model_missions')
        .select('*')
        .eq('model_id', event.model_id)
        .eq('active', true)

      if (error) throw error
      return missions || []
    } catch (error) {
      console.error('Error loading event missions:', error)
      return []
    }
  }

  /**
   * Load team's progress records
   */
  private async loadTeamProgress(teamId: string): Promise<TeamProgress[]> {
    try {
      const { data: progress, error } = await this.supabase
        .from('team_progress')
        .select('*')
        .eq('team_id', teamId)
        .order('start_time')

      if (error) throw error
      return progress || []
    } catch (error) {
      console.error('Error loading team progress:', error)
      return []
    }
  }

  /**
   * Get real-time event status for organizers
   */
  async getEventStatus(eventId: string): Promise<{
    totalTeams: number,
    activeTeams: number,
    completedTeams: number,
    averageProgress: number,
    currentlyPlayingTeams: number,
    stationUtilization: Record<string, number>
  }> {
    try {
      const { data: teams } = await this.supabase
        .from('teams')
        .select(`
          *,
          team_progress (*)
        `)
        .eq('event_id', eventId)

      if (!teams) {
        return {
          totalTeams: 0,
          activeTeams: 0,
          completedTeams: 0,
          averageProgress: 0,
          currentlyPlayingTeams: 0,
          stationUtilization: {}
        }
      }

      const totalTeams = teams.length
      const activeTeams = teams.filter(t => t.status === 'active').length
      const completedTeams = teams.filter(t => t.status === 'completed').length
      const currentlyPlayingTeams = teams.filter(t => 
        t.status === 'active' && t.current_station_id
      ).length

      // Calculate average progress
      const stations = await this.loadEventStations(eventId)
      const totalStations = stations.length
      
      let totalProgress = 0
      teams.forEach(team => {
        const progress = (team as any).team_progress || []
        const completedCount = progress.filter((p: any) => p.status === 'completed').length
        totalProgress += totalStations > 0 ? (completedCount / totalStations) * 100 : 0
      })
      const averageProgress = totalTeams > 0 ? totalProgress / totalTeams : 0

      // Calculate station utilization
      const stationUtilization: Record<string, number> = {}
      teams.forEach(team => {
        if (team.current_station_id) {
          stationUtilization[team.current_station_id] = 
            (stationUtilization[team.current_station_id] || 0) + 1
        }
      })

      return {
        totalTeams,
        activeTeams,
        completedTeams,
        averageProgress: Math.round(averageProgress),
        currentlyPlayingTeams,
        stationUtilization
      }

    } catch (error) {
      console.error('Error getting event status:', error)
      return {
        totalTeams: 0,
        activeTeams: 0,
        completedTeams: 0,
        averageProgress: 0,
        currentlyPlayingTeams: 0,
        stationUtilization: {}
      }
    }
  }
}