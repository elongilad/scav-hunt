'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Play, Pause, Square, Users, MapPin, Clock, Activity,
  AlertTriangle, CheckCircle, Settings, BarChart3,
  Radio, Shield, Zap, Target, Eye, RefreshCw
} from 'lucide-react'
import { EventStatusController } from './EventStatusController'
import { RealTimeMonitor } from './RealTimeMonitor'
import { TeamCoordinator } from './TeamCoordinator'
import { StationController } from './StationController'
import { EmergencyPanel } from './EmergencyPanel'
import { AnalyticsDashboard } from './AnalyticsDashboard'

interface Props {
  eventId: string
}

interface EventStats {
  totalTeams: number
  activeTeams: number
  completedTeams: number
  totalStations: number
  activeStations: number
  totalVisits: number
  averageProgress: number
  currentPhase: string
}

export function EventControlPanelClient({ eventId }: Props) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('monitor')
  const [stats, setStats] = useState<EventStats>({
    totalTeams: 0,
    activeTeams: 0,
    completedTeams: 0,
    totalStations: 0,
    activeStations: 0,
    totalVisits: 0,
    averageProgress: 0,
    currentPhase: 'pending'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const supabase = createClientComponentClient()

  // Load event statistics
  useEffect(() => {
    loadEventStats()
    const interval = setInterval(loadEventStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [eventId])

  // Real-time subscriptions for live updates
  useEffect(() => {
    const channels: any[] = []

    // Subscribe to team status changes
    const teamChannel = supabase
      .channel('team_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hunt_teams', filter: `event_id=eq.${eventId}` },
        () => loadEventStats()
      )
      .subscribe()

    // Subscribe to station visits
    const visitChannel = supabase
      .channel('station_visits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_station_visits', filter: `event_id=eq.${eventId}` },
        () => loadEventStats()
      )
      .subscribe()

    channels.push(teamChannel, visitChannel)

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [eventId])

  const loadEventStats = async () => {
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
        .select('id, team_id, station_id')
        .eq('event_id', eventId)

      // Get event status
      const { data: event } = await supabase
        .from('hunt_events')
        .select('status')
        .eq('id', eventId)
        .single()

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

      setStats({
        totalTeams,
        activeTeams,
        completedTeams,
        totalStations,
        activeStations,
        totalVisits,
        averageProgress,
        currentPhase: event?.status || 'pending'
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading event stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'finished': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'active': return <Play className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'finished': return <Square className="w-4 h-4" />
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Event Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('control.current_phase', 'Current Phase')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getPhaseIcon(stats.currentPhase)}
                  <span className="text-2xl font-bold text-white capitalize">
                    {stats.currentPhase}
                  </span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getPhaseColor(stats.currentPhase)}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('control.teams', 'Teams')}
                </p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.activeTeams}/{stats.totalTeams}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('control.stations', 'Stations')}
                </p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.activeStations}/{stats.totalStations}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('control.progress', 'Average Progress')}
                </p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.averageProgress}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Update Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw className="w-4 h-4" />
          {t('control.last_updated', 'Last updated')}: {lastUpdate.toLocaleTimeString()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadEventStats}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('control.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Control Panel Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-white/10 border-white/20">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('control.monitor', 'Monitor')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('control.control', 'Control')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('control.teams', 'Teams')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="stations" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('control.stations', 'Stations')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('control.emergency', 'Emergency')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('control.analytics', 'Analytics')}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <RealTimeMonitor eventId={eventId} stats={stats} />
        </TabsContent>

        <TabsContent value="control" className="space-y-4">
          <EventStatusController eventId={eventId} onStatusChange={loadEventStats} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamCoordinator eventId={eventId} stats={stats} />
        </TabsContent>

        <TabsContent value="stations" className="space-y-4">
          <StationController eventId={eventId} stats={stats} />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <EmergencyPanel eventId={eventId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard eventId={eventId} stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}