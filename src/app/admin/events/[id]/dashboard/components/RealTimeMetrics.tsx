'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Activity, TrendingUp, Clock, Zap, Timer, AlertCircle,
  ArrowUp, ArrowDown, Minus, BarChart3
} from 'lucide-react'

interface Props {
  eventId: string
  stats: {
    totalTeams: number
    activeTeams: number
    completedTeams: number
    totalStations: number
    activeStations: number
    totalVisits: number
    averageProgress: number
    eventsPerMinute: number
    systemHealth: number
  }
}

interface MetricTrend {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export function RealTimeMetrics({ eventId, stats }: Props) {
  const { t } = useLanguage()
  const [metrics, setMetrics] = useState<{
    activityRate: MetricTrend
    completionRate: MetricTrend
    averageTime: MetricTrend
    errorRate: MetricTrend
  }>({
    activityRate: { value: 0, change: 0, trend: 'stable' },
    completionRate: { value: 0, change: 0, trend: 'stable' },
    averageTime: { value: 0, change: 0, trend: 'stable' },
    errorRate: { value: 0, change: 0, trend: 'stable' }
  })
  const [historicalData, setHistoricalData] = useState<number[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [eventId])

  const loadMetrics = async () => {
    try {
      // Get activity rate (visits per minute)
      const now = new Date()
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000)

      const { data: recentVisits } = await supabase
        .from('team_station_visits')
        .select('id, visit_time')
        .eq('event_id', eventId)
        .gte('visit_time', tenMinutesAgo.toISOString())

      const { data: previousVisits } = await supabase
        .from('team_station_visits')
        .select('id, visit_time')
        .eq('event_id', eventId)
        .gte('visit_time', twentyMinutesAgo.toISOString())
        .lt('visit_time', tenMinutesAgo.toISOString())

      const currentRate = (recentVisits?.length || 0) / 10
      const previousRate = (previousVisits?.length || 0) / 10
      const activityChange = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : 0

      // Get completion rate
      const completionRate = stats.totalTeams > 0 ? (stats.completedTeams / stats.totalTeams) * 100 : 0

      // Get average completion time for finished teams
      const { data: finishedTeams } = await supabase
        .from('hunt_teams')
        .select('start_time, finish_time')
        .eq('event_id', eventId)
        .eq('status', 'finished')
        .not('start_time', 'is', null)
        .not('finish_time', 'is', null)

      let averageTime = 0
      if (finishedTeams && finishedTeams.length > 0) {
        const totalTime = finishedTeams.reduce((sum, team) => {
          const start = new Date(team.start_time!).getTime()
          const finish = new Date(team.finish_time!).getTime()
          return sum + (finish - start)
        }, 0)
        averageTime = totalTime / finishedTeams.length / (1000 * 60) // Convert to minutes
      }

      // Calculate error rate (simplified - based on system health)
      const errorRate = Math.max(0, 100 - stats.systemHealth)

      setMetrics({
        activityRate: {
          value: currentRate,
          change: activityChange,
          trend: activityChange > 5 ? 'up' : activityChange < -5 ? 'down' : 'stable'
        },
        completionRate: {
          value: completionRate,
          change: 0, // Would need historical data for proper calculation
          trend: 'stable'
        },
        averageTime: {
          value: averageTime,
          change: 0,
          trend: 'stable'
        },
        errorRate: {
          value: errorRate,
          change: 0,
          trend: errorRate > 10 ? 'up' : 'stable'
        }
      })

      // Update historical data for mini chart
      setHistoricalData(prev => {
        const newData = [...prev, currentRate].slice(-20)
        return newData
      })

    } catch (error) {
      console.error('Error loading real-time metrics:', error)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-400" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-400" />
      default: return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: string, isInverse: boolean = false) => {
    switch (trend) {
      case 'up': return isInverse ? 'text-red-400' : 'text-green-400'
      case 'down': return isInverse ? 'text-green-400' : 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const MiniChart = ({ data }: { data: number[] }) => {
    if (data.length < 2) return null

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return (
      <div className="flex items-end gap-1 h-8 ml-2">
        {data.slice(-10).map((value, index) => {
          const height = ((value - min) / range) * 24 + 4
          return (
            <div
              key={index}
              className="bg-spy-gold/60 w-1.5 rounded-sm"
              style={{ height: `${height}px` }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {t('dashboard.real_time_metrics', 'Real-Time Metrics')}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {t('dashboard.live_performance_indicators', 'Live performance indicators and trends')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Rate */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                {t('dashboard.activity_rate', 'Activity Rate')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.activityRate.trend)}
              <span className={`text-xs ${getTrendColor(metrics.activityRate.trend)}`}>
                {metrics.activityRate.change > 0 ? '+' : ''}{metrics.activityRate.change.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">
                {metrics.activityRate.value.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400">
                {t('dashboard.visits_per_minute', 'visits/min')}
              </div>
            </div>
            <MiniChart data={historicalData} />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">
                {t('dashboard.completion_rate', 'Completion Rate')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.completionRate.trend)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">
                {metrics.completionRate.value.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">
                {t('dashboard.teams_finished', 'teams finished')}
              </div>
            </div>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.completionRate.value)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Average Time */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                {t('dashboard.average_completion_time', 'Avg. Completion Time')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.averageTime.trend)}
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {metrics.averageTime.value > 0 ? `${Math.round(metrics.averageTime.value)}m` : '-'}
            </div>
            <div className="text-xs text-gray-400">
              {t('dashboard.minutes', 'minutes')}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">
                {t('dashboard.system_health', 'System Health')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {stats.systemHealth < 90 && <AlertCircle className="w-4 h-4 text-orange-400" />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-lg font-bold ${
                stats.systemHealth >= 95 ? 'text-green-400' :
                stats.systemHealth >= 80 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.systemHealth.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-400">
                {t('dashboard.operational', 'operational')}
              </div>
            </div>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.systemHealth >= 95 ? 'bg-green-400' :
                  stats.systemHealth >= 80 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${stats.systemHealth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Events Per Minute */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-spy-gold" />
              <span className="text-sm text-gray-300">
                {t('dashboard.events_per_minute', 'Events/Minute')}
              </span>
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-spy-gold">
              {stats.eventsPerMinute}
            </div>
            <div className="text-xs text-gray-400">
              {t('dashboard.system_activity', 'system activity')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}