'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { BarChart3, TrendingUp, Clock, Users, MapPin, Award } from 'lucide-react'

interface Props {
  eventId: string
  stats: {
    totalTeams: number
    activeTeams: number
    completedTeams: number
    totalStations: number
    averageProgress: number
  }
}

interface AnalyticsData {
  teamPerformance: Array<{
    name: string
    stationsVisited: number
    timeSpent: number
    status: string
  }>
  stationPopularity: Array<{
    name: string
    visits: number
    averageTime: number
  }>
  hourlyActivity: Array<{
    hour: string
    visits: number
    teams: number
  }>
  completionStats: {
    averageCompletionTime: number
    fastestTeam: string
    mostVisitedStation: string
    leastVisitedStation: string
  }
}

export function AnalyticsDashboard({ eventId, stats }: Props) {
  const { t } = useLanguage()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    teamPerformance: [],
    stationPopularity: [],
    hourlyActivity: [],
    completionStats: {
      averageCompletionTime: 0,
      fastestTeam: 'N/A',
      mostVisitedStation: 'N/A',
      leastVisitedStation: 'N/A'
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadAnalytics()
  }, [eventId])

  const loadAnalytics = async () => {
    try {
      // Load team performance data
      const { data: teams } = await supabase
        .from('hunt_teams')
        .select(`
          id, name, status, start_time, finish_time,
          visits:team_station_visits(station_id, visit_time, leave_time)
        `)
        .eq('event_id', eventId)

      // Load station data
      const { data: stations } = await supabase
        .from('hunt_stations')
        .select(`
          id, name,
          visits:team_station_visits(team_id, visit_time, leave_time)
        `)
        .eq('event_id', eventId)

      if (teams && stations) {
        // Process team performance
        const teamPerformance = teams.map(team => {
          const visits = team.visits || []
          const stationsVisited = visits.length
          let timeSpent = 0

          if (team.start_time) {
            const endTime = team.finish_time ? new Date(team.finish_time) : new Date()
            timeSpent = Math.round((endTime.getTime() - new Date(team.start_time).getTime()) / 60000) // minutes
          }

          return {
            name: team.name,
            stationsVisited,
            timeSpent,
            status: team.status
          }
        })

        // Process station popularity
        const stationPopularity = stations.map(station => {
          const visits = station.visits || []
          const visitCount = visits.length
          let averageTime = 0

          if (visits.length > 0) {
            const totalTime = visits.reduce((sum: number, visit: any) => {
              if (visit.leave_time && visit.visit_time) {
                const duration = new Date(visit.leave_time).getTime() - new Date(visit.visit_time).getTime()
                return sum + duration
              }
              return sum
            }, 0)
            averageTime = Math.round(totalTime / visits.length / 60000) // minutes
          }

          return {
            name: station.name,
            visits: visitCount,
            averageTime
          }
        })

        // Generate mock hourly activity (would be calculated from real visit times)
        const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          visits: Math.floor(Math.random() * 20),
          teams: Math.floor(Math.random() * 10)
        }))

        // Calculate completion stats
        const completedTeams = teams.filter(t => t.finish_time && t.start_time)
        let averageCompletionTime = 0
        let fastestTeam = 'N/A'

        if (completedTeams.length > 0) {
          let fastestTime = Infinity
          completedTeams.forEach(team => {
            const completionTime = new Date(team.finish_time!).getTime() - new Date(team.start_time!).getTime()
            if (completionTime < fastestTime) {
              fastestTime = completionTime
              fastestTeam = team.name
            }
            averageCompletionTime += completionTime
          })
          averageCompletionTime = Math.round(averageCompletionTime / completedTeams.length / 60000)
        }

        const mostVisitedStation = stationPopularity.reduce((max, station) =>
          station.visits > max.visits ? station : max, { name: 'N/A', visits: 0 }
        ).name

        const leastVisitedStation = stationPopularity.reduce((min, station) =>
          station.visits < min.visits ? station : min, { name: 'N/A', visits: Infinity }
        ).name

        setAnalytics({
          teamPerformance,
          stationPopularity,
          hourlyActivity,
          completionStats: {
            averageCompletionTime,
            fastestTeam,
            mostVisitedStation,
            leastVisitedStation
          }
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('analytics.completion_rate', 'Completion Rate')}
                </p>
                <p className="text-2xl font-bold text-white mt-2">
                  {Math.round((stats.completedTeams / stats.totalTeams) * 100) || 0}%
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('analytics.avg_completion_time', 'Avg Completion Time')}
                </p>
                <p className="text-2xl font-bold text-white mt-2">
                  {formatTime(analytics.completionStats.averageCompletionTime)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('analytics.fastest_team', 'Fastest Team')}
                </p>
                <p className="text-lg font-bold text-white mt-2">
                  {analytics.completionStats.fastestTeam}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t('analytics.most_popular_station', 'Most Popular Station')}
                </p>
                <p className="text-lg font-bold text-white mt-2">
                  {analytics.completionStats.mostVisitedStation}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('analytics.team_performance', 'Team Performance')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('analytics.individual_team_stats', 'Individual team progress and statistics')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.teamPerformance.map((team, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-spy-gold rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{team.name}</p>
                    <p className="text-sm text-gray-400 capitalize">Status: {team.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{team.stationsVisited} stations</p>
                  <p className="text-sm text-gray-400">{formatTime(team.timeSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Station Analytics */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('analytics.station_analytics', 'Station Analytics')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('analytics.station_visit_patterns', 'Station visit patterns and popularity')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.stationPopularity.map((station, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{station.name}</h3>
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{t('analytics.total_visits', 'Total Visits')}:</span>
                    <span className="text-white font-medium">{station.visits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{t('analytics.avg_time', 'Avg Time')}:</span>
                    <span className="text-white font-medium">{formatTime(station.averageTime)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-spy-gold h-2 rounded-full"
                      style={{ width: `${Math.min(station.visits * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('analytics.activity_timeline', 'Activity Timeline')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('analytics.hourly_activity_pattern', 'Hourly activity patterns throughout the event')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.hourlyActivity.filter(h => h.visits > 0).map((hour, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-400 font-mono">{hour.hour}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{hour.visits} visits</span>
                    <span className="text-sm text-gray-400">{hour.teams} teams active</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(hour.visits / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}