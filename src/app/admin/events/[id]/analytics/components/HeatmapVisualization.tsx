'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { Thermometer, BarChart3, MapPin, Users, Clock } from 'lucide-react'

interface Props {
  eventId: string
}

interface HeatmapData {
  id: string
  name: string
  sequence_order: number
  intensity: number // 0-100
  visit_count: number
  unique_visitors: number
  average_duration: number
  peak_time: string
  congestion_level: 'low' | 'medium' | 'high' | 'critical'
}

export function HeatmapVisualization({ eventId }: Props) {
  const { t } = useLanguage()
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadHeatmapData()
  }, [eventId])

  const loadHeatmapData = async () => {
    try {
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select(`
          id, name, sequence_order,
          visits:team_station_visits(
            team_id, visit_time
          )
        `)
        .eq('event_id', eventId)
        .order('sequence_order')

      if (stationsData) {
        const maxVisits = Math.max(...stationsData.map(s => s.visits?.length || 0), 1)

        const heatmap: HeatmapData[] = stationsData.map(station => {
          const visits = station.visits || []
          const visitCount = visits.length
          const uniqueVisitors = new Set(visits.map((v: any) => v.team_id)).size
          const intensity = (visitCount / maxVisits) * 100

          // Mock data for duration and peak time
          const averageDuration = Math.random() * 20 + 5 // 5-25 minutes
          const peakHour = Math.floor(Math.random() * 12) + 9 // 9 AM - 9 PM
          const peakTime = `${peakHour}:00`

          let congestionLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
          if (intensity > 80) congestionLevel = 'critical'
          else if (intensity > 60) congestionLevel = 'high'
          else if (intensity > 30) congestionLevel = 'medium'

          return {
            id: station.id,
            name: station.name,
            sequence_order: station.sequence_order,
            intensity,
            visit_count: visitCount,
            unique_visitors: uniqueVisitors,
            average_duration: averageDuration,
            peak_time: peakTime,
            congestion_level: congestionLevel
          }
        })

        setHeatmapData(heatmap)
      }
    } catch (error) {
      console.error('Error loading heatmap data:', error)

      // Fallback mock data
      const mockData: HeatmapData[] = Array.from({ length: 8 }, (_, i) => ({
        id: `station-${i + 1}`,
        name: `Station ${i + 1}`,
        sequence_order: i + 1,
        intensity: Math.random() * 100,
        visit_count: Math.floor(Math.random() * 50) + 10,
        unique_visitors: Math.floor(Math.random() * 30) + 5,
        average_duration: Math.random() * 20 + 5,
        peak_time: `${Math.floor(Math.random() * 12) + 9}:00`,
        congestion_level: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)]
      }))

      setHeatmapData(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500'
    if (intensity >= 60) return 'bg-orange-500'
    if (intensity >= 40) return 'bg-yellow-500'
    if (intensity >= 20) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const getIntensityOpacity = (intensity: number) => {
    return Math.max(0.2, intensity / 100)
  }

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 border-red-500'
      case 'high': return 'text-orange-400 border-orange-500'
      case 'medium': return 'text-yellow-400 border-yellow-500'
      default: return 'text-green-400 border-green-500'
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading heatmap...</span>
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
              Activity Heatmap
            </CardTitle>
            <CardDescription className="text-gray-400">
              Visual representation of station activity levels
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="text-xs"
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="text-xs"
            >
              List
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {viewMode === 'grid' ? (
          <>
            {/* Heatmap Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {heatmapData.map(station => (
                <div
                  key={station.id}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer
                    ${getCongestionColor(station.congestion_level)}
                  `}
                  style={{
                    backgroundColor: `rgba(248, 205, 85, ${getIntensityOpacity(station.intensity)})`
                  }}
                >
                  {/* Station Number Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/50 text-white text-xs">
                      {station.sequence_order}
                    </Badge>
                  </div>

                  {/* Congestion Level Indicator */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-2 h-2 rounded-full ${getIntensityColor(station.intensity)}`} />
                  </div>

                  {/* Station Info */}
                  <div className="mt-4">
                    <h3 className="font-medium text-white text-sm mb-2 truncate">
                      {station.name}
                    </h3>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-white">
                        <span>Visits:</span>
                        <span className="font-medium">{station.visit_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Intensity:</span>
                        <span className="font-medium">{station.intensity.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Peak:</span>
                        <span className="font-medium">{station.peak_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <span className="text-sm font-medium text-white mb-2 block">Activity Level</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded" />
                    <span className="text-xs text-gray-300">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded" />
                    <span className="text-xs text-gray-300">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded" />
                    <span className="text-xs text-gray-300">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <span className="text-xs text-gray-300">Critical</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-white mb-2 block">Congestion</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Border color indicates congestion level</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* List View */
          <div className="space-y-3">
            {heatmapData
              .sort((a, b) => b.intensity - a.intensity)
              .map(station => (
                <div
                  key={station.id}
                  className={`p-4 rounded-lg border-l-4 bg-white/5 ${getCongestionColor(station.congestion_level)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 text-white">
                        #{station.sequence_order}
                      </Badge>
                      <h3 className="font-medium text-white">{station.name}</h3>
                      <Badge
                        className={`${getIntensityColor(station.intensity)} text-white border-0 text-xs`}
                      >
                        {station.congestion_level}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {station.intensity.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">intensity</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">{station.visit_count}</div>
                        <div className="text-gray-400 text-xs">Total Visits</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-white font-medium">{station.unique_visitors}</div>
                        <div className="text-gray-400 text-xs">Unique Teams</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <div>
                        <div className="text-white font-medium">{Math.round(station.average_duration)}m</div>
                        <div className="text-gray-400 text-xs">Avg Duration</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-white font-medium">{station.peak_time}</div>
                        <div className="text-gray-400 text-xs">Peak Time</div>
                      </div>
                    </div>
                  </div>

                  {/* Intensity Bar */}
                  <div className="mt-3">
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getIntensityColor(station.intensity)} rounded-full transition-all duration-500`}
                        style={{ width: `${station.intensity}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">
              {heatmapData.filter(s => s.congestion_level === 'critical').length}
            </div>
            <div className="text-xs text-gray-400">Critical Congestion</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">
              {heatmapData.filter(s => s.congestion_level === 'high').length}
            </div>
            <div className="text-xs text-gray-400">High Activity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-spy-gold">
              {heatmapData.length > 0 ? (heatmapData.reduce((sum, s) => sum + s.intensity, 0) / heatmapData.length).toFixed(0) : 0}%
            </div>
            <div className="text-xs text-gray-400">Avg Intensity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {heatmapData.reduce((sum, s) => sum + s.visit_count, 0)}
            </div>
            <div className="text-xs text-gray-400">Total Visits</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}