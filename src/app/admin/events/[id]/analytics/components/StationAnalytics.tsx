'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  MapPin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Users, Clock, Target, BarChart3
} from 'lucide-react'

interface Props {
  eventId: string
  compact?: boolean
}

interface StationAnalytics {
  id: string
  name: string
  sequence_order: number
  is_active: boolean
  visit_count: number
  unique_visitors: number
  completion_rate: number
  average_time: number
  difficulty_rating: 'easy' | 'medium' | 'hard' | 'very_hard'
  success_rate: number
  bottleneck_score: number
}

export function StationAnalytics({ eventId, compact = false }: Props) {
  const { t } = useLanguage()
  const [stations, setStations] = useState<StationAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadStationAnalytics()
  }, [eventId])

  const loadStationAnalytics = async () => {
    try {
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select(`
          id, name, sequence_order, is_active,
          visits:team_station_visits(
            team_id, visit_time
          )
        `)
        .eq('event_id', eventId)
        .order('sequence_order')

      const { data: teamsData } = await supabase
        .from('hunt_teams')
        .select('id')
        .eq('event_id', eventId)

      const totalTeams = teamsData?.length || 0

      if (stationsData) {
        const analytics: StationAnalytics[] = stationsData.map(station => {
          const visits = station.visits || []
          const visitCount = visits.length
          const uniqueVisitors = new Set(visits.map(v => v.team_id)).size
          const completionRate = totalTeams > 0 ? (uniqueVisitors / totalTeams) * 100 : 0

          // Mock average time (would calculate from actual visit data)
          const averageTime = Math.random() * 20 + 5 // 5-25 minutes

          // Difficulty rating based on completion rate and time
          let difficultyRating: 'easy' | 'medium' | 'hard' | 'very_hard' = 'medium'
          if (completionRate > 80 && averageTime < 10) difficultyRating = 'easy'
          else if (completionRate < 40 || averageTime > 20) difficultyRating = 'hard'
          else if (completionRate < 20 || averageTime > 30) difficultyRating = 'very_hard'

          const successRate = completionRate
          const bottleneckScore = averageTime > 15 && completionRate < 50 ? 80 : 20

          return {
            id: station.id,
            name: station.name,
            sequence_order: station.sequence_order,
            is_active: station.is_active,
            visit_count: visitCount,
            unique_visitors: uniqueVisitors,
            completion_rate: completionRate,
            average_time: averageTime,
            difficulty_rating: difficultyRating,
            success_rate: successRate,
            bottleneck_score: bottleneckScore
          }
        })

        setStations(analytics)
      }
    } catch (error) {
      console.error('Error loading station analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (rating: string) => {
    switch (rating) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-orange-500'
      case 'very_hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getBottleneckIndicator = (score: number) => {
    if (score > 60) return { icon: AlertTriangle, color: 'text-red-400', label: 'Bottleneck' }
    if (score > 30) return { icon: TrendingDown, color: 'text-yellow-400', label: 'Slow' }
    return { icon: CheckCircle, color: 'text-green-400', label: 'Smooth' }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading station analytics...</span>
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
            <MapPin className="w-4 h-4" />
            Station Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stations.slice(0, 5).map(station => {
            const bottleneck = getBottleneckIndicator(station.bottleneck_score)
            const IconComponent = bottleneck.icon
            
            return (
              <div key={station.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="flex items-center gap-2">
                  <Badge className={`${getDifficultyColor(station.difficulty_rating)} text-white text-xs px-1`}>
                    {station.sequence_order}
                  </Badge>
                  <span className="text-white text-sm font-medium truncate">{station.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-spy-gold font-medium">{station.completion_rate.toFixed(0)}%</div>
                    <div className="text-xs text-gray-400">{station.unique_visitors} teams</div>
                  </div>
                  <IconComponent className={`w-3 h-3 ${bottleneck.color}`} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Station Analytics
        </CardTitle>
        <CardDescription className="text-gray-400">
          Performance metrics and difficulty analysis for each station
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {stations.map(station => {
            const bottleneck = getBottleneckIndicator(station.bottleneck_score)
            const IconComponent = bottleneck.icon

            return (
              <div key={station.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getDifficultyColor(station.difficulty_rating)} text-white px-2 py-1`}>
                      {station.sequence_order}
                    </Badge>
                    <div>
                      <h3 className="font-medium text-white">{station.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={station.is_active ? 'secondary' : 'outline'} className="text-xs">
                          {station.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className={`${getDifficultyColor(station.difficulty_rating)} text-white text-xs`}>
                          {station.difficulty_rating}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${bottleneck.color}`}>
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm">{bottleneck.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Completion:</span>
                    <div className="text-white font-medium">{station.completion_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Visitors:</span>
                    <div className="text-white font-medium">{station.unique_visitors}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg Time:</span>
                    <div className="text-white font-medium">{Math.round(station.average_time)}m</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Visits:</span>
                    <div className="text-white font-medium">{station.visit_count}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-spy-gold rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, station.completion_rate)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}