'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Users, MapPin, Clock, Trophy, RotateCcw, Eye, Activity, Target,
  CheckCircle, AlertCircle, TrendingUp, Play, Pause, Timer,
  Navigation, Zap, Award
} from 'lucide-react'
import { getEventProgress } from '@/server/actions/tracking/getEventProgress'

interface TeamProgress {
  teamId: string
  teamName: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedStations: number
  totalStations: number
  progressPercent: number
  currentStation: {
    id: string
    name: string
  } | null
  startTime: string | null
  endTime: string | null
  timeElapsedSeconds: number
  lastActivity: string | null
  visits: Array<{
    stationId: string
    stationName: string
    visitedAt: string
    completed: boolean
  }>
}

interface EventStats {
  totalTeams: number
  teamsStarted: number
  teamsCompleted: number
  teamsInProgress: number
  averageProgress: number
  completionRate: number
}

interface LiveProgressData {
  event: {
    id: string
    name: string | null
    startsAt: string | null
  }
  teams: TeamProgress[]
  stats: EventStats
  totalStations: number
  totalMissions: number
  eventStarted: boolean
  lastUpdate: string
}

interface Props {
  eventId: string
  initialData: LiveProgressData | null
}

export function LiveProgressTracker({ eventId, initialData }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<LiveProgressData | null>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  const refreshData = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      const result = await getEventProgress({ eventId })
      if (result.ok) {
        setData(result as LiveProgressData)
        setLastUpdateTime(new Date())
      }
    } catch (error) {
      console.error('Failed to refresh progress data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [eventId, isRefreshing])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(refreshData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, refreshData])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return t('tracking.just_now', 'Just now')
    if (diffMinutes < 60) return t('tracking.minutes_ago', `${diffMinutes}m ago`)
    const diffHours = Math.floor(diffMinutes / 60)
    return t('tracking.hours_ago', `${diffHours}h ago`)
  }

  const getStatusBadge = (status: TeamProgress['status']) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="outline" className="border-gray-500/30 text-gray-400">
            {t('tracking.not_started', 'Not Started')}
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 animate-pulse">
            {t('tracking.in_progress', 'In Progress')}
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500/30 text-green-400">
            {t('tracking.completed', 'Completed')}
          </Badge>
        )
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-400">{t('tracking.loading', 'Loading progress data...')}</p>
        </div>
      </div>
    )
  }

  const { teams, stats, event } = data

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">
            {t('tracking.live_progress', 'Live Progress')}
          </h2>
          <Badge
            variant={data.eventStarted ? "default" : "secondary"}
            className={data.eventStarted ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
          >
            {data.eventStarted ? t('tracking.event_active', 'Event Active') : t('tracking.event_waiting', 'Waiting to Start')}
          </Badge>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`bg-white/10 border-white/20 text-white hover:bg-white/20 ${
              autoRefresh ? 'bg-spy-gold/20 border-spy-gold/30 text-spy-gold' : ''
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t('tracking.auto_refresh', 'Auto Refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.teamsInProgress}</p>
                <p className="text-xs text-gray-400">{t('tracking.teams_active', 'Teams Active')}</p>
              </div>
              <Activity className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.teamsCompleted}</p>
                <p className="text-xs text-gray-400">{t('tracking.teams_completed', 'Completed')}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.averageProgress}%</p>
                <p className="text-xs text-gray-400">{t('tracking.avg_progress', 'Avg Progress')}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.completionRate}%</p>
                <p className="text-xs text-gray-400">{t('tracking.completion_rate', 'Completion')}</p>
              </div>
              <Award className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Progress */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-spy-gold" />
            {t('tracking.team_status', 'Team Status')} ({stats.totalTeams})
          </CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription className="text-gray-400">
              {t('tracking.real_time_tracking', 'Real-time team progress tracking')}
            </CardDescription>
            <span className="text-xs text-gray-500">
              {t('tracking.last_updated', 'Last updated')}: {formatRelativeTime(lastUpdateTime.toISOString())}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {teams.map((team) => (
              <div key={team.teamId} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{team.teamName}</h3>
                      {getStatusBadge(team.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {team.currentStation && (
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {team.currentStation.name}
                        </div>
                      )}
                      {team.startTime && (
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {formatTime(team.timeElapsedSeconds)}
                        </div>
                      )}
                      {team.lastActivity && (
                        <div className="text-gray-500">
                          {formatRelativeTime(team.lastActivity)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {team.completedStations}/{team.totalStations}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t('tracking.stations', 'stations')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('tracking.progress', 'Progress')}</span>
                    <span className="text-white font-medium">{team.progressPercent}%</span>
                  </div>
                  <Progress
                    value={team.progressPercent}
                    className="h-2"
                  />
                </div>

                {team.visits.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3 h-3 text-spy-gold" />
                      <span className="text-xs text-gray-400 font-medium">
                        {t('tracking.recent_visits', 'Recent Visits')}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {team.visits.slice(-5).map((visit, index) => (
                        <Badge
                          key={`${visit.stationId}-${index}`}
                          variant="outline"
                          className={`text-xs ${
                            visit.completed
                              ? 'border-green-500/30 text-green-400 bg-green-500/10'
                              : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                          }`}
                        >
                          {visit.stationName}
                          {visit.completed && <CheckCircle className="w-2 h-2 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {teams.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  {t('tracking.no_teams', 'No teams registered for this event')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}