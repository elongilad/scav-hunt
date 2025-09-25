'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, TrendingUp, Timer, BarChart3 } from 'lucide-react'

interface Props {
  eventId: string
  compact?: boolean
}

interface TimeData {
  hourlyActivity: Array<{ hour: number; visits: number; teams: number }>
  peakHours: { start: number; end: number; activity: number }
  averageSessionDuration: number
  completionTimes: number[]
  timeDistribution: { quick: number; normal: number; slow: number }
}

export function TimeAnalytics({ eventId, compact = false }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<TimeData>({
    hourlyActivity: [],
    peakHours: { start: 0, end: 0, activity: 0 },
    averageSessionDuration: 0,
    completionTimes: [],
    timeDistribution: { quick: 0, normal: 0, slow: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTimeAnalytics()
  }, [eventId])

  const loadTimeAnalytics = async () => {
    try {
      // Generate mock time analytics data
      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        visits: Math.floor(Math.random() * 50) + 10,
        teams: Math.floor(Math.random() * 20) + 5
      }))

      const peakActivity = Math.max(...hourlyActivity.map(h => h.visits))
      const peakHour = hourlyActivity.find(h => h.visits === peakActivity)?.hour || 12

      const completionTimes = Array.from({ length: 20 }, () => Math.random() * 120 + 30)
      const avgDuration = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length

      setData({
        hourlyActivity,
        peakHours: { start: peakHour, end: peakHour + 2, activity: peakActivity },
        averageSessionDuration: avgDuration,
        completionTimes,
        timeDistribution: {
          quick: completionTimes.filter(t => t < 60).length,
          normal: completionTimes.filter(t => t >= 60 && t <= 120).length,
          slow: completionTimes.filter(t => t > 120).length
        }
      })
    } catch (error) {
      console.error('Error loading time analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading time analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Time Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-spy-gold">
              {formatTime(data.averageSessionDuration)}
            </div>
            <div className="text-xs text-gray-400">Average Duration</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {data.peakHours.start}:00 - {data.peakHours.end}:00
            </div>
            <div className="text-xs text-gray-400">Peak Hours</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Time Analytics
        </CardTitle>
        <CardDescription className="text-gray-400">
          Activity patterns and timing analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activity Chart */}
        <div>
          <h4 className="text-white font-medium mb-3">24-Hour Activity Pattern</h4>
          <div className="flex items-end gap-1 h-32">
            {data.hourlyActivity.map((hour) => {
              const height = (hour.visits / Math.max(...data.hourlyActivity.map(h => h.visits))) * 100
              return (
                <div key={hour.hour} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-spy-gold/60 w-full rounded-sm mb-1"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-400 transform -rotate-45 origin-bottom">
                    {hour.hour}:00
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <Timer className="w-6 h-6 mx-auto mb-2 text-spy-gold" />
            <div className="text-lg font-bold text-white">
              {formatTime(data.averageSessionDuration)}
            </div>
            <div className="text-xs text-gray-400">Avg Duration</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-lg font-bold text-white">
              {data.peakHours.start}:00-{data.peakHours.end}:00
            </div>
            <div className="text-xs text-gray-400">Peak Hours</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-lg font-bold text-white">
              {data.timeDistribution.normal}
            </div>
            <div className="text-xs text-gray-400">Normal Pace</div>
          </div>
        </div>

        {/* Completion Distribution */}
        <div>
          <h4 className="text-white font-medium mb-3">Completion Time Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Quick (&lt; 1h)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(data.timeDistribution.quick / data.completionTimes.length) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.timeDistribution.quick}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Normal (1-2h)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(data.timeDistribution.normal / data.completionTimes.length) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.timeDistribution.normal}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Slow (&gt; 2h)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(data.timeDistribution.slow / data.completionTimes.length) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.timeDistribution.slow}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}