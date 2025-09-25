'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  MapPin, TrendingUp, Users, Clock, AlertTriangle,
  Activity, Thermometer, Eye, BarChart3
} from 'lucide-react'

interface Props {
  eventId: string
}

interface StationData {
  id: string
  name: string
  sequence_order: number
  is_active: boolean
  visit_count: number
  current_teams: number
  avg_time_spent: number
  completion_rate: number
  difficulty_score: number
  congestion_level: 'low' | 'medium' | 'high' | 'critical'
  recent_visits: Array<{
    visit_time: string
    team_name: string
  }>
}

export function StationHeatMap({ eventId }: Props) {
  const { t } = useLanguage()
  const [stations, setStations] = useState<StationData[]>([])
  const [viewMode, setViewMode] = useState<'heatmap' | 'list'>('heatmap')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadStationData()
    const interval = setInterval(loadStationData, 20000) // Update every 20 seconds
    return () => clearInterval(interval)
  }, [eventId])

  const loadStationData = async () => {
    try {
      // Get all stations with visit data
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select(`
          id, name, sequence_order, is_active,
          visits:team_station_visits(
            visit_time,
            team:hunt_teams(name)
          )
        `)
        .eq('event_id', eventId)
        .order('sequence_order')

      // Get current teams at each station
      const { data: currentTeams } = await supabase
        .from('hunt_teams')
        .select('current_station_id')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .not('current_station_id', 'is', null)

      // Get total team count for completion rate calculation
      const { data: totalTeams } = await supabase
        .from('hunt_teams')
        .select('id')
        .eq('event_id', eventId)

      const totalTeamCount = totalTeams?.length || 0

      if (stationsData) {
        const processedStations: StationData[] = stationsData.map(station => {
          const visits = station.visits || []
          const visitCount = visits.length
          const currentTeamsCount = currentTeams?.filter(t => t.current_station_id === station.id).length || 0

          // Calculate average time spent (simplified - would need exit times in real implementation)
          const avgTimeSpent = visitCount > 0 ? Math.random() * 15 + 5 : 0 // Mock data: 5-20 minutes

          // Calculate completion rate
          const completionRate = totalTeamCount > 0 ? (visitCount / totalTeamCount) * 100 : 0

          // Calculate difficulty score based on completion rate and time spent
          const difficultyScore = completionRate > 0 ?
            Math.max(0, 100 - completionRate + (avgTimeSpent / 20) * 50) : 0

          // Determine congestion level
          let congestionLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
          if (currentTeamsCount >= 5) congestionLevel = 'critical'
          else if (currentTeamsCount >= 3) congestionLevel = 'high'
          else if (currentTeamsCount >= 2) congestionLevel = 'medium'

          // Get recent visits (last 5)
          const recentVisits = visits
            .sort((a, b) => new Date(b.visit_time).getTime() - new Date(a.visit_time).getTime())
            .slice(0, 5)
            .map(visit => ({
              visit_time: visit.visit_time,
              team_name: visit.team?.name || 'Unknown Team'
            }))

          return {
            id: station.id,
            name: station.name,
            sequence_order: station.sequence_order,
            is_active: station.is_active,
            visit_count: visitCount,
            current_teams: currentTeamsCount,
            avg_time_spent: Math.round(avgTimeSpent),
            completion_rate: Math.round(completionRate),
            difficulty_score: Math.round(difficultyScore),
            congestion_level,
            recent_visits: recentVisits
          }
        })

        setStations(processedStations)
      }
    } catch (error) {
      console.error('Error loading station data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getCongestionTextColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getDifficultyColor = (score: number) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 60) return 'text-orange-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getHeatIntensity = (visitCount: number, maxVisits: number) => {
    if (maxVisits === 0) return 0
    return (visitCount / maxVisits) * 100
  }

  const maxVisits = Math.max(...stations.map(s => s.visit_count), 1)

  const HeatMapGrid = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {stations.map(station => {
          const intensity = getHeatIntensity(station.visit_count, maxVisits)
          const heatColor = `rgba(248, 205, 85, ${intensity / 100 * 0.8 + 0.1})` // spy-gold with opacity

          return (
            <div
              key={station.id}
              className="relative p-3 rounded-lg border border-white/20 transition-all hover:border-spy-gold/50"
              style={{ backgroundColor: heatColor }}
            >
              {/* Station Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white truncate">
                  {station.sequence_order}. {station.name}
                </span>
                <div className={`w-2 h-2 rounded-full ${getCongestionColor(station.congestion_level)}`} />
              </div>

              {/* Visit Count */}
              <div className="text-lg font-bold text-white mb-1">
                {station.visit_count}
              </div>
              <div className="text-xs text-gray-300 mb-2">
                {t('dashboard.visits', 'visits')}
              </div>

              {/* Current Teams */}
              {station.current_teams > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Users className="w-3 h-3" />
                  <span className="text-white">{station.current_teams} active</span>
                </div>
              )}

              {/* Inactive indicator */}
              {!station.is_active && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading station data...</span>
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
              <Thermometer className="w-5 h-5" />
              {t('dashboard.station_heat_map', 'Station Heat Map')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('dashboard.activity_levels_congestion', 'Activity levels and congestion monitoring')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'heatmap' ? 'default' : 'outline'}
              onClick={() => setViewMode('heatmap')}
              className="text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Heat
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="text-xs"
            >
              <Activity className="w-3 h-3 mr-1" />
              List
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {t('dashboard.no_stations_found', 'No stations found for this event')}
          </div>
        ) : viewMode === 'heatmap' ? (
          <>
            <HeatMapGrid />

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">{t('dashboard.activity_level', 'Activity Level')}:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-spy-gold/20 rounded border border-spy-gold/30" />
                    <span className="text-gray-300">Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-spy-gold/60 rounded border border-spy-gold/70" />
                    <span className="text-gray-300">High</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{t('dashboard.congestion', 'Congestion')}:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stations.map(station => (
              <div key={station.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                {/* Station Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-spy-gold" />
                      <span className="font-medium text-white">{station.name}</span>
                    </div>
                    <Badge variant={station.is_active ? 'secondary' : 'outline'} className="text-xs">
                      {station.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getCongestionColor(station.congestion_level)} text-white border-0`}>
                      {station.congestion_level}
                    </Badge>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{station.visit_count}</div>
                    <div className="text-xs text-gray-400">Total Visits</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getCongestionTextColor(station.congestion_level)}`}>
                      {station.current_teams}
                    </div>
                    <div className="text-xs text-gray-400">Current Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{station.avg_time_spent}m</div>
                    <div className="text-xs text-gray-400">Avg Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-spy-gold">{station.completion_rate}%</div>
                    <div className="text-xs text-gray-400">Completion</div>
                  </div>
                </div>

                {/* Difficulty and Recent Activity */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className={`font-medium ${getDifficultyColor(station.difficulty_score)}`}>
                      {station.difficulty_score}/100
                    </span>
                  </div>
                  {station.recent_visits.length > 0 && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Last: {new Date(station.recent_visits[0].visit_time).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                {/* Alerts */}
                {(station.congestion_level === 'critical' || station.difficulty_score > 80) && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      {station.congestion_level === 'critical' && 'High congestion detected'}
                      {station.congestion_level !== 'critical' && station.difficulty_score > 80 && 'High difficulty - teams may need assistance'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">
                {stations.filter(s => s.congestion_level === 'low').length}
              </div>
              <div className="text-xs text-gray-400">Low Activity</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {stations.filter(s => s.congestion_level === 'medium').length}
              </div>
              <div className="text-xs text-gray-400">Medium Activity</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-400">
                {stations.filter(s => s.congestion_level === 'high').length}
              </div>
              <div className="text-xs text-gray-400">High Activity</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">
                {stations.filter(s => s.congestion_level === 'critical').length}
              </div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}