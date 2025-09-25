'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Users, Trophy, Clock, TrendingUp, TrendingDown, Target,
  BarChart3, Award, Zap, Timer, CheckCircle
} from 'lucide-react'

interface Props {
  eventId: string
  compact?: boolean
}

interface TeamPerformance {
  id: string
  name: string
  status: string
  start_time: string | null
  finish_time: string | null
  total_time: number
  stations_completed: number
  total_stations: number
  completion_rate: number
  average_time_per_station: number
  rank: number
  efficiency_score: number
  visits: Array<{
    station_id: string
    visit_time: string
    station: { name: string; sequence_order: number }
  }>
}

interface AnalyticsData {
  teams: TeamPerformance[]
  averages: {
    completion_time: number
    stations_completed: number
    efficiency_score: number
  }
  leaderboard: TeamPerformance[]
  distribution: {
    fast: number
    medium: number
    slow: number
  }
}

export function TeamPerformanceAnalytics({ eventId, compact = false }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<AnalyticsData>({
    teams: [],
    averages: { completion_time: 0, stations_completed: 0, efficiency_score: 0 },
    leaderboard: [],
    distribution: { fast: 0, medium: 0, slow: 0 }
  })
  const [sortBy, setSortBy] = useState<'rank' | 'time' | 'completion' | 'efficiency'>('rank')
  const [filterStatus, setFilterStatus] = useState<'all' | 'finished' | 'active'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTeamPerformance()
  }, [eventId])

  const loadTeamPerformance = async () => {
    try {
      // Get teams with their visits
      const { data: teamsData } = await supabase
        .from('hunt_teams')
        .select(`
          id, name, status, start_time, finish_time,
          visits:team_station_visits(
            station_id, visit_time,
            station:hunt_stations(name, sequence_order)
          )
        `)
        .eq('event_id', eventId)
        .order('name')

      // Get total stations count
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select('id')
        .eq('event_id', eventId)

      const totalStations = stationsData?.length || 0

      if (teamsData) {
        const teams: TeamPerformance[] = teamsData.map(team => {
          const visits = team.visits || []
          const stationsCompleted = new Set(visits.map(v => v.station_id)).size
          const completionRate = totalStations > 0 ? (stationsCompleted / totalStations) * 100 : 0

          // Calculate total time
          let totalTime = 0
          if (team.start_time) {
            const endTime = team.finish_time ? new Date(team.finish_time) : new Date()
            const startTime = new Date(team.start_time)
            totalTime = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // minutes
          }

          // Calculate average time per station
          const averageTimePerStation = stationsCompleted > 0 ? totalTime / stationsCompleted : 0

          // Calculate efficiency score (stations per minute)
          const efficiencyScore = totalTime > 0 ? (stationsCompleted / totalTime) * 60 : 0

          return {
            id: team.id,
            name: team.name,
            status: team.status,
            start_time: team.start_time,
            finish_time: team.finish_time,
            total_time: totalTime,
            stations_completed: stationsCompleted,
            total_stations: totalStations,
            completion_rate: completionRate,
            average_time_per_station: averageTimePerStation,
            rank: 0, // Will be calculated after sorting
            efficiency_score: efficiencyScore,
            visits: visits.map(visit => ({
              station_id: visit.station_id,
              visit_time: visit.visit_time,
              station: Array.isArray(visit.station) ? visit.station[0] : visit.station
            })).sort((a, b) => new Date(a.visit_time).getTime() - new Date(b.visit_time).getTime())
          }
        })

        // Calculate rankings
        const finishedTeams = teams.filter(t => t.status === 'finished')
        finishedTeams.sort((a, b) => {
          if (a.completion_rate !== b.completion_rate) {
            return b.completion_rate - a.completion_rate
          }
          return a.total_time - b.total_time
        })

        finishedTeams.forEach((team, index) => {
          team.rank = index + 1
        })

        // Calculate averages
        const completedTeams = teams.filter(t => t.stations_completed > 0)
        const averages = {
          completion_time: completedTeams.length > 0 ?
            completedTeams.reduce((sum, t) => sum + t.total_time, 0) / completedTeams.length : 0,
          stations_completed: completedTeams.length > 0 ?
            completedTeams.reduce((sum, t) => sum + t.stations_completed, 0) / completedTeams.length : 0,
          efficiency_score: completedTeams.length > 0 ?
            completedTeams.reduce((sum, t) => sum + t.efficiency_score, 0) / completedTeams.length : 0
        }

        // Performance distribution
        const distribution = {
          fast: finishedTeams.filter(t => t.total_time < averages.completion_time * 0.8).length,
          medium: finishedTeams.filter(t => t.total_time >= averages.completion_time * 0.8 && t.total_time <= averages.completion_time * 1.2).length,
          slow: finishedTeams.filter(t => t.total_time > averages.completion_time * 1.2).length
        }

        setData({
          teams,
          averages,
          leaderboard: finishedTeams.slice(0, 10),
          distribution
        })
      }
    } catch (error) {
      console.error('Error loading team performance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSortedAndFilteredTeams = () => {
    let filtered = data.teams

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t =>
        filterStatus === 'finished' ? t.status === 'finished' : t.status === 'active'
      )
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return a.total_time - b.total_time
        case 'completion':
          return b.completion_rate - a.completion_rate
        case 'efficiency':
          return b.efficiency_score - a.efficiency_score
        default:
          return (a.rank || 999) - (b.rank || 999)
      }
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-blue-500'
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getPerformanceIndicator = (team: TeamPerformance) => {
    if (team.efficiency_score > data.averages.efficiency_score * 1.2) {
      return { icon: TrendingUp, color: 'text-green-400', label: 'Excellent' }
    } else if (team.efficiency_score < data.averages.efficiency_score * 0.8) {
      return { icon: TrendingDown, color: 'text-red-400', label: 'Needs Help' }
    } else {
      return { icon: Target, color: 'text-yellow-400', label: 'Average' }
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading team analytics...</span>
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
            <Users className="w-4 h-4" />
            Team Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.leaderboard.slice(0, 5).map((team, index) => (
            <div key={team.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
              <div className="flex items-center gap-2">
                <Badge className={`${index < 3 ? 'bg-spy-gold text-black' : 'bg-white/20'} w-6 h-6 p-0 flex items-center justify-center text-xs`}>
                  {index + 1}
                </Badge>
                <span className="text-white text-sm font-medium">{team.name}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-spy-gold font-medium">{team.completion_rate.toFixed(0)}%</div>
                <div className="text-xs text-gray-400">{formatTime(team.total_time)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Average Completion</p>
                <p className="text-xl font-bold text-white">
                  {data.averages.stations_completed.toFixed(1)}
                </p>
              </div>
              <Target className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Average Time</p>
                <p className="text-xl font-bold text-white">
                  {formatTime(data.averages.completion_time)}
                </p>
              </div>
              <Clock className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Efficiency Score</p>
                <p className="text-xl font-bold text-white">
                  {data.averages.efficiency_score.toFixed(1)}
                </p>
              </div>
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Completed</p>
                <p className="text-xl font-bold text-white">
                  {data.leaderboard.length}
                </p>
              </div>
              <Trophy className="w-6 h-6 text-spy-gold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Team Performance Analysis
              </CardTitle>
              <CardDescription className="text-gray-400">
                Detailed performance metrics for all teams
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'finished' | 'active')}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'rank' | 'time' | 'completion' | 'efficiency')}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">By Rank</SelectItem>
                  <SelectItem value="time">By Time</SelectItem>
                  <SelectItem value="completion">By Completion</SelectItem>
                  <SelectItem value="efficiency">By Efficiency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getSortedAndFilteredTeams().map(team => {
              const indicator = getPerformanceIndicator(team)
              const IconComponent = indicator.icon

              return (
                <div key={team.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {team.rank > 0 && (
                        <Badge className={`${team.rank <= 3 ? 'bg-spy-gold text-black' : 'bg-white/20'} w-8 h-8 p-0 flex items-center justify-center`}>
                          {team.rank}
                        </Badge>
                      )}
                      <div>
                        <h3 className="font-medium text-white">{team.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getStatusColor(team.status)} text-white border-0 text-xs`}>
                            {team.status}
                          </Badge>
                          <div className={`flex items-center gap-1 ${indicator.color}`}>
                            <IconComponent className="w-3 h-3" />
                            <span className="text-xs">{indicator.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Progress:</span>
                      <div className="text-white font-medium">
                        {team.stations_completed}/{team.total_stations}
                        <span className="text-spy-gold ml-1">({team.completion_rate.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Time:</span>
                      <div className="text-white font-medium">{formatTime(team.total_time)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg/Station:</span>
                      <div className="text-white font-medium">
                        {team.average_time_per_station > 0 ? formatTime(team.average_time_per_station) : '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Efficiency:</span>
                      <div className="text-white font-medium">{team.efficiency_score.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-spy-gold rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, team.completion_rate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {getSortedAndFilteredTeams().length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No teams match the current filter criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}