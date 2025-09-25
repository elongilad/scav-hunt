'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Activity, Users, MapPin, Clock, Eye, RefreshCw,
  TrendingUp, AlertCircle, CheckCircle, Timer,
  Navigation, Zap
} from 'lucide-react'

interface Props {
  eventId: string
  stats: {
    totalTeams: number
    activeTeams: number
    totalStations: number
    currentPhase: string
  }
}

interface TeamActivity {
  id: string
  name: string
  status: string
  currentStation: string | null
  lastActivity: string
  progress: number
}

interface StationActivity {
  id: string
  name: string
  currentTeams: number
  totalVisits: number
  averageTime: number
  isActive: boolean
}

interface RecentEvent {
  id: string
  type: string
  teamName: string
  stationName?: string
  timestamp: string
  description: string
}

export function RealTimeMonitor({ eventId, stats }: Props) {
  const { t } = useLanguage()
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([])
  const [stationActivities, setStationActivities] = useState<StationActivity[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadActivityData()
    const interval = setInterval(loadActivityData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [eventId])

  // Real-time subscriptions for immediate updates
  useEffect(() => {
    const channels: any[] = []

    // Subscribe to team station visits
    const visitChannel = supabase
      .channel('real_time_visits')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_station_visits', filter: `event_id=eq.${eventId}` },
        (payload) => {
          addRecentEvent({
            type: 'visit',
            teamName: 'Team',
            stationName: 'Station',
            description: 'New station visit'
          })
          loadActivityData()
        }
      )
      .subscribe()

    // Subscribe to team status changes
    const teamChannel = supabase
      .channel('real_time_teams')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hunt_teams', filter: `event_id=eq.${eventId}` },
        (payload) => {
          addRecentEvent({
            type: 'status',
            teamName: payload.new.name || 'Team',
            description: `Team status changed to ${payload.new.status}`
          })
          loadActivityData()
        }
      )
      .subscribe()

    channels.push(visitChannel, teamChannel)

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [eventId])

  const loadActivityData = async () => {
    try {
      // Load team activities
      const { data: teams } = await supabase
        .from('hunt_teams')
        .select(`
          id, name, status, current_station_id, updated_at,
          current_station:hunt_stations(name)
        `)
        .eq('event_id', eventId)

      // Load station activities
      const { data: stations } = await supabase
        .from('hunt_stations')
        .select(`
          id, name, is_active,
          visits:team_station_visits(team_id, visit_time, leave_time)
        `)
        .eq('event_id', eventId)

      if (teams) {
        const teamActivities = teams.map(team => ({
          id: team.id,
          name: team.name,
          status: team.status,
          currentStation: (team.current_station as any)?.name || null,
          lastActivity: team.updated_at,
          progress: 0 // Would calculate based on visits
        }))
        setTeamActivities(teamActivities)
      }

      if (stations) {
        const stationActivities = stations.map(station => {
          const visits = station.visits || []
          const currentTeams = visits.filter((v: any) => !v.leave_time).length
          const totalVisits = visits.length
          const averageTime = visits.length > 0
            ? visits.reduce((acc: number, visit: any) => {
                if (visit.leave_time && visit.visit_time) {
                  const duration = new Date(visit.leave_time).getTime() - new Date(visit.visit_time).getTime()
                  return acc + duration
                }
                return acc
              }, 0) / visits.length / 60000 // Convert to minutes
            : 0

          return {
            id: station.id,
            name: station.name,
            currentTeams,
            totalVisits,
            averageTime: Math.round(averageTime),
            isActive: station.is_active
          }
        })
        setStationActivities(stationActivities)
      }

    } catch (error) {
      console.error('Error loading activity data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addRecentEvent = (event: Omit<RecentEvent, 'id' | 'timestamp'>) => {
    const newEvent: RecentEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...event
    }
    setRecentEvents(prev => [newEvent, ...prev.slice(0, 9)]) // Keep last 10 events
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'waiting': return 'bg-yellow-500'
      case 'finished': return 'bg-blue-500'
      case 'inactive': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />
      case 'waiting': return <Clock className="w-4 h-4" />
      case 'finished': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Activity Feed */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('monitor.live_activity', 'Live Activity Feed')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">
                {t('monitor.live', 'Live')}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                {t('monitor.no_recent_activity', 'No recent activity')}
              </p>
            ) : (
              recentEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    {event.type === 'visit' ? (
                      <MapPin className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Users className="w-4 h-4 text-green-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {event.teamName}
                        {event.stationName && ` → ${event.stationName}`}
                      </p>
                      <p className="text-gray-400 text-xs">{event.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Status Overview */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('monitor.team_status', 'Team Status Overview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamActivities.map(team => (
              <div key={team.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{team.name}</h3>
                  <Badge className={`${getStatusColor(team.status)} text-white border-0`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(team.status)}
                      <span className="capitalize">{team.status}</span>
                    </div>
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('monitor.current_station', 'Current Station')}:</span>
                    <span className="text-white">
                      {team.currentStation || t('monitor.none', 'None')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('monitor.last_activity', 'Last Activity')}:</span>
                    <span className="text-white">
                      {new Date(team.lastActivity).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Station Activity Monitor */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('monitor.station_activity', 'Station Activity Monitor')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stationActivities.map(station => (
              <div key={station.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">{station.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${station.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('monitor.current_teams', 'Current Teams')}:</span>
                    <Badge variant="outline" className="text-white border-white/20">
                      {station.currentTeams}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('monitor.total_visits', 'Total Visits')}:</span>
                    <span className="text-white font-medium">{station.totalVisits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('monitor.avg_time', 'Avg Time')}:</span>
                    <span className="text-white font-medium">{station.averageTime}m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t('monitor.performance_metrics', 'Performance Metrics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round((stats.activeTeams / stats.totalTeams) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-400">
                {t('monitor.team_participation', 'Team Participation')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {recentEvents.length}
              </div>
              <div className="text-sm text-gray-400">
                {t('monitor.recent_events', 'Recent Events')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {stationActivities.reduce((sum, station) => sum + station.currentTeams, 0)}
              </div>
              <div className="text-sm text-gray-400">
                {t('monitor.active_visits', 'Active Visits')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(stationActivities.reduce((sum, station) => sum + station.averageTime, 0) / (stationActivities.length || 1))}m
              </div>
              <div className="text-sm text-gray-400">
                {t('monitor.avg_station_time', 'Avg Station Time')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}