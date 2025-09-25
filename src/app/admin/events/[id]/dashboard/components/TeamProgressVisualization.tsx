'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Users, MapPin, Trophy, Clock, Play, Pause, CheckCircle,
  AlertCircle, Navigation, Target, ArrowRight
} from 'lucide-react'

interface Props {
  eventId: string
}

interface TeamProgress {
  id: string
  name: string
  status: string
  current_station_id: string | null
  start_time: string | null
  finish_time: string | null
  current_station: { name: string; sequence_order: number } | null
  visits: Array<{
    station_id: string
    visit_time: string
    station: { name: string; sequence_order: number }
  }>
  total_stations: number
  progress_percentage: number
}

export function TeamProgressVisualization({ eventId }: Props) {
  const { t } = useLanguage()
  const [teams, setTeams] = useState<TeamProgress[]>([])
  const [stations, setStations] = useState<Array<{ id: string; name: string; sequence_order: number }>>([])
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('list')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTeamProgress()
    const interval = setInterval(loadTeamProgress, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [eventId])

  const loadTeamProgress = async () => {
    try {
      // Get all stations for this event
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select('id, name, sequence_order')
        .eq('event_id', eventId)
        .order('sequence_order')

      setStations(stationsData || [])

      // Get teams with their progress
      const { data: teamsData } = await supabase
        .from('hunt_teams')
        .select(`
          id, name, status, current_station_id, start_time, finish_time,
          current_station:hunt_stations(name, sequence_order),
          visits:team_station_visits(
            station_id, visit_time,
            station:hunt_stations(name, sequence_order)
          )
        `)
        .eq('event_id', eventId)
        .order('name')

      if (teamsData && stationsData) {
        const teamsWithProgress = teamsData.map(team => ({
          ...team,
          current_station: Array.isArray(team.current_station)
            ? team.current_station[0] || null
            : team.current_station,
          visits: team.visits?.map((visit: any) => ({
            ...visit,
            station: Array.isArray(visit.station)
              ? visit.station[0] || null
              : visit.station
          })) || [],
          total_stations: stationsData.length,
          progress_percentage: stationsData.length > 0
            ? Math.round((team.visits?.length || 0) / stationsData.length * 100)
            : 0
        }))

        setTeams(teamsWithProgress)
      }
    } catch (error) {
      console.error('Error loading team progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'waiting': return 'bg-yellow-500'
      case 'paused': return 'bg-orange-500'
      case 'finished': return 'bg-blue-500'
      case 'inactive': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />
      case 'waiting': return <Clock className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'finished': return <Trophy className="w-3 h-3" />
      default: return <Users className="w-3 h-3" />
    }
  }

  const getElapsedTime = (startTime: string | null) => {
    if (!startTime) return '-'
    const start = new Date(startTime)
    const now = new Date()
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
    const hours = Math.floor(elapsed / 60)
    const minutes = elapsed % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const StationProgressFlow = ({ team }: { team: TeamProgress }) => {
    const visitedStations = new Set(team.visits?.map(v => v.station_id) || [])

    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stations.map((station, index) => {
          const isVisited = visitedStations.has(station.id)
          const isCurrent = team.current_station_id === station.id
          const isNext = !isVisited && !isCurrent && stations.slice(0, index).every(s => visitedStations.has(s.id))

          return (
            <div key={station.id} className="flex items-center gap-2 flex-shrink-0">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                ${isVisited ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-spy-gold text-black' :
                  isNext ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400' :
                  'bg-white/10 border border-white/20 text-gray-400'}
              `}>
                {isVisited ? <CheckCircle className="w-4 h-4" /> :
                 isCurrent ? <Navigation className="w-4 h-4" /> :
                 station.sequence_order}
              </div>
              {index < stations.length - 1 && (
                <ArrowRight className={`w-3 h-3 ${
                  visitedStations.has(station.id) ? 'text-green-400' : 'text-gray-600'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const ProgressBar = ({ percentage, status }: { percentage: number; status: string }) => {
    const getBarColor = () => {
      if (status === 'finished') return 'bg-blue-500'
      if (percentage >= 80) return 'bg-green-500'
      if (percentage >= 60) return 'bg-spy-gold'
      if (percentage >= 40) return 'bg-yellow-500'
      return 'bg-orange-500'
    }

    return (
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading team progress...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('dashboard.team_progress', 'Team Progress')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('dashboard.real_time_team_tracking', 'Real-time team tracking and station progression')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="text-xs"
            >
              List
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'flow' ? 'default' : 'outline'}
              onClick={() => setViewMode('flow')}
              className="text-xs"
            >
              Flow
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {t('dashboard.no_teams_found', 'No teams found for this event')}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teams.map(team => (
              <div key={team.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                {/* Team Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-white">{team.name}</h3>
                    <Badge className={`${getStatusColor(team.status)} text-white border-0 flex items-center gap-1`}>
                      {getStatusIcon(team.status)}
                      <span className="capitalize">{team.status}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400">
                    {team.visits?.length || 0}/{team.total_stations} stations
                  </div>
                </div>

                {/* Progress Visualization */}
                {viewMode === 'flow' ? (
                  <div className="mb-3">
                    <StationProgressFlow team={team} />
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{team.progress_percentage}%</span>
                    </div>
                    <ProgressBar percentage={team.progress_percentage} status={team.status} />
                  </div>
                )}

                {/* Team Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-gray-400">
                      {t('dashboard.current_station', 'Current Station')}:
                    </div>
                    <div className="text-white flex items-center gap-1">
                      {team.current_station ? (
                        <>
                          <MapPin className="w-3 h-3 text-spy-gold" />
                          {team.current_station.name}
                        </>
                      ) : (
                        <span className="text-gray-500">
                          {t('dashboard.no_station', 'No station')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-gray-400">
                      {t('dashboard.elapsed_time', 'Elapsed Time')}:
                    </div>
                    <div className="text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      {getElapsedTime(team.start_time)}
                    </div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-4 text-xs">
                    {team.status === 'active' && (
                      <div className="flex items-center gap-1 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        {t('dashboard.active_now', 'Active now')}
                      </div>
                    )}
                    {team.status === 'finished' && team.finish_time && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <Trophy className="w-3 h-3" />
                        Finished {new Date(team.finish_time).toLocaleTimeString()}
                      </div>
                    )}
                    {team.status === 'paused' && (
                      <div className="flex items-center gap-1 text-orange-400">
                        <AlertCircle className="w-3 h-3" />
                        {t('dashboard.paused', 'Paused')}
                      </div>
                    )}
                  </div>

                  {team.progress_percentage === 100 && team.status !== 'finished' && (
                    <div className="text-xs text-spy-gold flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {t('dashboard.ready_to_finish', 'Ready to finish')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">
                {teams.filter(t => t.status === 'active').length}
              </div>
              <div className="text-xs text-gray-400">
                {t('dashboard.active_teams', 'Active Teams')}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-spy-gold">
                {teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + t.progress_percentage, 0) / teams.length) : 0}%
              </div>
              <div className="text-xs text-gray-400">
                {t('dashboard.average_progress', 'Avg Progress')}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {teams.filter(t => t.status === 'finished').length}
              </div>
              <div className="text-xs text-gray-400">
                {t('dashboard.completed', 'Completed')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}