'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Activity, Users, MapPin, Clock, TrendingUp, AlertTriangle,
  CheckCircle, Zap, Target, Eye, RefreshCw, BarChart3,
  Timer, Award, MessageCircle, Shield, Gauge
} from 'lucide-react'
import { RealTimeMetrics } from './RealTimeMetrics'
import { TeamProgressVisualization } from './TeamProgressVisualization'
import { StationHeatMap } from './StationHeatMap'
import { EventTimeline } from './EventTimeline'
import { PerformanceInsights } from './PerformanceInsights'

interface Props {
  eventId: string
  eventData: {
    id: string
    name: string
    status: string
    start_time: string | null
    end_time: string | null
  }
}

interface LiveStats {
  totalTeams: number
  activeTeams: number
  completedTeams: number
  totalStations: number
  activeStations: number
  totalVisits: number
  averageProgress: number
  currentPhase: string
  eventsPerMinute: number
  systemHealth: number
}

export function LiveEventDashboard({ eventId, eventData }: Props) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<LiveStats>({
    totalTeams: 0,
    activeTeams: 0,
    completedTeams: 0,
    totalStations: 0,
    activeStations: 0,
    totalVisits: 0,
    averageProgress: 0,
    currentPhase: eventData.status,
    eventsPerMinute: 0,
    systemHealth: 100
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected')
  const supabase = createClientComponentClient()

  // Real-time data loading
  useEffect(() => {
    loadLiveStats()
    const interval = setInterval(loadLiveStats, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [eventId])

  // Real-time subscriptions
  useEffect(() => {
    const channels: any[] = []
    setConnectionStatus('connected')

    // Subscribe to team updates
    const teamChannel = supabase
      .channel(`teams_${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hunt_teams', filter: `event_id=eq.${eventId}` },
        () => {
          loadLiveStats()
          updateEventsPerMinute()
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'reconnecting')
      })

    // Subscribe to station visits
    const visitChannel = supabase
      .channel(`visits_${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_station_visits', filter: `event_id=eq.${eventId}` },
        () => {
          loadLiveStats()
          updateEventsPerMinute()
        }
      )
      .subscribe()

    // Subscribe to messages/notifications
    const messageChannel = supabase
      .channel(`messages_${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_messages', filter: `event_id=eq.${eventId}` },
        () => updateEventsPerMinute()
      )
      .subscribe()

    channels.push(teamChannel, visitChannel, messageChannel)

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [eventId])

  const loadLiveStats = async () => {
    try {
      // Get team statistics
      const { data: teams } = await supabase
        .from('hunt_teams')
        .select('id, status, current_station_id')
        .eq('event_id', eventId)

      // Get station statistics
      const { data: stations } = await supabase
        .from('hunt_stations')
        .select('id, is_active')
        .eq('event_id', eventId)

      // Get visit statistics
      const { data: visits } = await supabase
        .from('team_station_visits')
        .select('id, team_id, station_id, visit_time')
        .eq('event_id', eventId)

      const totalTeams = teams?.length || 0
      const activeTeams = teams?.filter(t => t.status === 'active').length || 0
      const completedTeams = teams?.filter(t => t.status === 'finished').length || 0
      const totalStations = stations?.length || 0
      const activeStations = stations?.filter(s => s.is_active).length || 0
      const totalVisits = visits?.length || 0

      // Calculate average progress
      const averageProgress = totalTeams > 0 && totalStations > 0
        ? Math.round((totalVisits / (totalTeams * totalStations)) * 100)
        : 0

      // Calculate system health (based on various factors)
      const systemHealth = Math.min(100, Math.max(0,
        100 - (connectionStatus === 'connected' ? 0 : 20) -
        (totalTeams > 0 ? Math.max(0, (activeTeams / totalTeams) < 0.5 ? 15 : 0) : 0)
      ))

      setStats({
        totalTeams,
        activeTeams,
        completedTeams,
        totalStations,
        activeStations,
        totalVisits,
        averageProgress,
        currentPhase: eventData.status,
        eventsPerMinute: stats.eventsPerMinute,
        systemHealth
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading live stats:', error)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const updateEventsPerMinute = () => {
    // Simple counter for events per minute (would be more sophisticated in production)
    setStats(prev => ({
      ...prev,
      eventsPerMinute: prev.eventsPerMinute + 1
    }))

    // Reset counter every minute
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        eventsPerMinute: 0
      }))
    }, 60000)
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'active': return 'text-green-400'
      case 'paused': return 'text-yellow-400'
      case 'finished': return 'text-blue-400'
      case 'cancelled': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'reconnecting': return 'bg-yellow-500 animate-pulse'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSystemHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-400'
    if (health >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <Card className="bg-gradient-to-r from-spy-gold/10 to-white/10 border-spy-gold/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(connectionStatus)}`} />
                <span className="text-white font-medium">
                  {connectionStatus === 'connected' ? t('dashboard.live', 'LIVE') :
                   connectionStatus === 'reconnecting' ? t('dashboard.reconnecting', 'RECONNECTING') :
                   t('dashboard.disconnected', 'DISCONNECTED')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-spy-gold" />
                <span className="text-sm text-gray-300">
                  {stats.eventsPerMinute} {t('dashboard.events_per_minute', 'events/min')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className={`w-4 h-4 ${getSystemHealthColor(stats.systemHealth)}`} />
                <span className={`text-sm font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                  {t('dashboard.system_health', 'System Health')}: {stats.systemHealth}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`text-lg font-bold ${getPhaseColor(stats.currentPhase)}`}>
                  {stats.currentPhase.toUpperCase()}
                </div>
                <div className="text-xs text-gray-400">
                  {t('dashboard.last_updated', 'Updated')}: {lastUpdate.toLocaleTimeString()}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadLiveStats}
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t('dashboard.refresh', 'Refresh')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.total_teams', 'Total Teams')}
                </p>
                <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
              </div>
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.active_teams', 'Active')}
                </p>
                <p className="text-2xl font-bold text-green-400">{stats.activeTeams}</p>
              </div>
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.completed', 'Completed')}
                </p>
                <p className="text-2xl font-bold text-blue-400">{stats.completedTeams}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.stations', 'Stations')}
                </p>
                <p className="text-2xl font-bold text-white">{stats.activeStations}/{stats.totalStations}</p>
              </div>
              <MapPin className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.total_visits', 'Total Visits')}
                </p>
                <p className="text-2xl font-bold text-white">{stats.totalVisits}</p>
              </div>
              <Target className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.progress', 'Progress')}
                </p>
                <p className="text-2xl font-bold text-spy-gold">{stats.averageProgress}%</p>
              </div>
              <TrendingUp className="w-6 h-6 text-spy-gold" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {t('dashboard.efficiency', 'Efficiency')}
                </p>
                <p className={`text-2xl font-bold ${getSystemHealthColor(stats.systemHealth)}`}>
                  {Math.round(stats.systemHealth)}%
                </p>
              </div>
              <Zap className={`w-6 h-6 ${getSystemHealthColor(stats.systemHealth)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Metrics */}
        <RealTimeMetrics eventId={eventId} stats={stats} />

        {/* Team Progress Visualization */}
        <TeamProgressVisualization eventId={eventId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Station Heat Map */}
        <StationHeatMap eventId={eventId} />

        {/* Event Timeline */}
        <EventTimeline eventId={eventId} />

        {/* Performance Insights */}
        <PerformanceInsights eventId={eventId} stats={stats} />
      </div>
    </div>
  )
}