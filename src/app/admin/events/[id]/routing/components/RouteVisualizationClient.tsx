'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Route, Navigation, MapPin, Clock, Users, TrendingUp, Zap,
  RefreshCw, Play, BarChart3, Map, Compass, Timer, Target,
  ChevronRight, Navigation2, Footprints, Car, Bus, Award
} from 'lucide-react'
import { generateOptimalRoutes } from '@/server/actions/routing/generateOptimalRoutes'

interface RouteSegment {
  fromStationId: string
  toStationId: string
  distance: number
  estimatedTime: number
  transportMode: "walking" | "driving" | "public_transport"
  waypoints?: Array<{ lat: number; lng: number; description?: string }>
  instructions?: string[]
}

interface StationVisit {
  stationId: string
  stationName: string
  arrivalTime: Date
  departureTime: Date
  missionId: string
  missionTitle: string
  estimatedDuration: number
  sequence: number
}

interface TeamRoute {
  teamId: string
  teamName: string
  totalDistance: number
  totalTime: number
  difficulty: number
  segments: RouteSegment[]
  stations: StationVisit[]
  optimizationScore: number
}

interface RouteAnalytics {
  totalRoutes: number
  averageTime: number
  averageDistance: number
  averageOptimizationScore: number
  difficultyDistribution: Record<string, number>
  transportModeBreakdown: Record<string, number>
  longestRoute: number
  shortestRoute: number
  mostOptimizedScore: number
  leastOptimizedScore: number
}

interface Props {
  eventId: string
  initialRoutes?: TeamRoute[]
}

type RoutingStrategy = "optimal_time" | "balanced_difficulty" | "scenic_route" | "shortest_distance"

export function RouteVisualizationClient({ eventId, initialRoutes = [] }: Props) {
  const { t } = useLanguage()
  const [routes, setRoutes] = useState<TeamRoute[]>(initialRoutes)
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<RoutingStrategy>("optimal_time")
  const [analytics, setAnalytics] = useState<RouteAnalytics | null>(null)

  const strategies = [
    {
      value: "optimal_time" as const,
      name: t('routing.strategy_time', 'Optimal Time'),
      description: t('routing.strategy_time_desc', 'Minimize total travel time'),
      icon: <Timer className="w-4 h-4" />,
      color: "bg-blue-500"
    },
    {
      value: "balanced_difficulty" as const,
      name: t('routing.strategy_balanced', 'Balanced Difficulty'),
      description: t('routing.strategy_balanced_desc', 'Progressive difficulty increase'),
      icon: <Target className="w-4 h-4" />,
      color: "bg-green-500"
    },
    {
      value: "scenic_route" as const,
      name: t('routing.strategy_scenic', 'Scenic Route'),
      description: t('routing.strategy_scenic_desc', 'Prioritize interesting locations'),
      icon: <Map className="w-4 h-4" />,
      color: "bg-purple-500"
    },
    {
      value: "shortest_distance" as const,
      name: t('routing.strategy_distance', 'Shortest Distance'),
      description: t('routing.strategy_distance_desc', 'Minimize total walking distance'),
      icon: <Compass className="w-4 h-4" />,
      color: "bg-orange-500"
    }
  ]

  const handleGenerateRoutes = async () => {
    setIsGenerating(true)
    try {
      const result = await generateOptimalRoutes({
        eventId,
        routingStrategy: selectedStrategy,
        constraints: {
          maxRouteTime: 300, // 5 hours
          avoidCrowdedStations: true,
          includeRestStops: true
        }
      })

      if (result.ok) {
        setRoutes(result.routes)
        setAnalytics(result.analytics)
        setShowAnalytics(true)
      }
    } catch (error) {
      console.error('Route generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${Math.round(meters)}m`
  }

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "walking": return <Footprints className="w-4 h-4" />
      case "driving": return <Car className="w-4 h-4" />
      case "public_transport": return <Bus className="w-4 h-4" />
      default: return <Navigation className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 1.5) return "bg-green-500/20 text-green-400 border-green-500/30"
    if (difficulty <= 2.5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (difficulty <= 3.5) return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 1.5) return t('routing.difficulty_easy', 'Easy')
    if (difficulty <= 2.5) return t('routing.difficulty_medium', 'Medium')
    if (difficulty <= 3.5) return t('routing.difficulty_hard', 'Hard')
    return t('routing.difficulty_expert', 'Expert')
  }

  const selectedRoute = routes.find(r => r.teamId === selectedTeamId)

  return (
    <div className="space-y-6">
      {/* Route Generation Controls */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Route className="w-5 h-5 text-spy-gold" />
            {t('routing.route_generation', 'Route Generation')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('routing.generation_description', 'Generate optimized routes for all teams using advanced algorithms')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Selection */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
              {t('routing.routing_strategy', 'Routing Strategy')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategies.map((strategy) => (
                <div
                  key={strategy.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStrategy === strategy.value
                      ? 'border-spy-gold bg-spy-gold/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedStrategy(strategy.value)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${strategy.color} flex items-center justify-center text-white`}>
                      {strategy.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm">{strategy.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={handleGenerateRoutes}
              disabled={isGenerating}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('routing.generating', 'Generating Routes...')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('routing.generate_routes', 'Generate Routes')}
                </>
              )}
            </Button>

            {analytics && (
              <Button
                variant="outline"
                onClick={() => setShowAnalytics(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('routing.view_analytics', 'View Analytics')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Overview */}
      {routes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-spy-gold">{routes.length}</p>
                  <p className="text-xs text-gray-400">{t('routing.total_routes', 'Total Routes')}</p>
                </div>
                <Route className="w-6 h-6 text-spy-gold/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-spy-gold">
                    {formatTime(routes.reduce((sum, r) => sum + r.totalTime, 0) / routes.length)}
                  </p>
                  <p className="text-xs text-gray-400">{t('routing.avg_route_time', 'Avg Route Time')}</p>
                </div>
                <Clock className="w-6 h-6 text-spy-gold/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-spy-gold">
                    {Math.round(routes.reduce((sum, r) => sum + r.optimizationScore, 0) / routes.length)}%
                  </p>
                  <p className="text-xs text-gray-400">{t('routing.avg_optimization', 'Avg Optimization')}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-spy-gold/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Route Details */}
      {routes.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Navigation className="w-5 h-5 text-spy-gold" />
                {t('routing.team_routes', 'Team Routes')}
              </CardTitle>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('routing.select_team', 'Select a team')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {routes.map((route) => (
                    <SelectItem key={route.teamId} value={route.teamId} className="text-white">
                      {route.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="overview" className="data-[state=active]:bg-spy-gold data-[state=active]:text-black">
                  {t('routing.overview', 'Overview')}
                </TabsTrigger>
                <TabsTrigger value="stations" className="data-[state=active]:bg-spy-gold data-[state=active]:text-black">
                  {t('routing.stations', 'Stations')}
                </TabsTrigger>
                <TabsTrigger value="segments" className="data-[state=active]:bg-spy-gold data-[state=active]:text-black">
                  {t('routing.segments', 'Route Segments')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                {selectedRoute ? (
                  <div className="space-y-4">
                    {/* Route Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-spy-gold">{formatTime(selectedRoute.totalTime)}</p>
                        <p className="text-xs text-gray-400">{t('routing.total_time', 'Total Time')}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-spy-gold">{formatDistance(selectedRoute.totalDistance)}</p>
                        <p className="text-xs text-gray-400">{t('routing.total_distance', 'Total Distance')}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-spy-gold">{selectedRoute.stations.length}</p>
                        <p className="text-xs text-gray-400">{t('routing.total_stations', 'Total Stations')}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-spy-gold">{selectedRoute.optimizationScore}%</p>
                        <p className="text-xs text-gray-400">{t('routing.optimization_score', 'Optimization')}</p>
                      </div>
                    </div>

                    {/* Difficulty & Progress */}
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getDifficultyColor(selectedRoute.difficulty)}>
                        {getDifficultyLabel(selectedRoute.difficulty)}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{t('routing.route_efficiency', 'Route Efficiency')}</span>
                          <span className="text-white">{selectedRoute.optimizationScore}%</span>
                        </div>
                        <Progress value={selectedRoute.optimizationScore} className="h-2" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Navigation2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">{t('routing.select_team_to_view', 'Select a team to view route details')}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stations" className="mt-6">
                {selectedRoute ? (
                  <div className="space-y-3">
                    {selectedRoute.stations.map((station, index) => (
                      <div key={station.stationId} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-spy-gold text-black font-bold flex items-center justify-center text-sm">
                              {station.sequence}
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{station.stationName}</h3>
                              <p className="text-sm text-gray-400">{station.missionTitle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm font-medium">
                              {formatTime(station.estimatedDuration)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(station.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">{t('routing.select_team_for_stations', 'Select a team to view station sequence')}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="segments" className="mt-6">
                {selectedRoute ? (
                  <div className="space-y-3">
                    {selectedRoute.segments.map((segment, index) => {
                      const fromStation = selectedRoute.stations.find(s => s.stationId === segment.fromStationId)
                      const toStation = selectedRoute.stations.find(s => s.stationId === segment.toStationId)

                      return (
                        <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getTransportIcon(segment.transportMode)}
                              <div>
                                <h3 className="text-white font-medium flex items-center gap-2">
                                  {fromStation?.stationName}
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                  {toStation?.stationName}
                                </h3>
                                <p className="text-sm text-gray-400 capitalize">{segment.transportMode.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white text-sm font-medium">
                                {formatDistance(segment.distance)} • {formatTime(segment.estimatedTime)}
                              </p>
                            </div>
                          </div>

                          {segment.instructions && segment.instructions.length > 0 && (
                            <div className="pl-7 space-y-1">
                              {segment.instructions.map((instruction, idx) => (
                                <p key={idx} className="text-xs text-gray-400">{instruction}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Route className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">{t('routing.select_team_for_segments', 'Select a team to view route segments')}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-spy-gold" />
              {t('routing.route_analytics', 'Route Analytics')}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('routing.analytics_description', 'Comprehensive analysis of generated routes')}
            </DialogDescription>
          </DialogHeader>

          {analytics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">{formatTime(analytics.averageTime)}</p>
                  <p className="text-xs text-gray-400">{t('routing.avg_route_time', 'Avg Route Time')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">{formatDistance(analytics.averageDistance)}</p>
                  <p className="text-xs text-gray-400">{t('routing.avg_distance', 'Avg Distance')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">{analytics.averageOptimizationScore}%</p>
                  <p className="text-xs text-gray-400">{t('routing.avg_optimization', 'Avg Optimization')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">{analytics.totalRoutes}</p>
                  <p className="text-xs text-gray-400">{t('routing.total_routes', 'Total Routes')}</p>
                </div>
              </div>

              {/* Transport Mode Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('routing.transport_modes', 'Transport Mode Usage')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(analytics.transportModeBreakdown).map(([mode, count]) => (
                    <div key={mode} className="bg-white/5 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {getTransportIcon(mode)}
                        <span className="text-white font-medium capitalize">{mode.replace('_', ' ')}</span>
                      </div>
                      <p className="text-2xl font-bold text-spy-gold">{count}</p>
                      <p className="text-xs text-gray-400">{t('routing.segments', 'segments')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('routing.difficulty_distribution', 'Difficulty Distribution')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(analytics.difficultyDistribution).map(([level, count]) => (
                    <div key={level} className="bg-white/5 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-spy-gold">{count}</p>
                      <p className="text-xs text-gray-400 capitalize">{level} {t('routing.routes', 'routes')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Range Statistics */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('routing.route_ranges', 'Route Ranges')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">{t('routing.longest_route', 'Longest Route')}:</span>
                    <span className="text-white ml-2 font-medium">{formatTime(analytics.longestRoute)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('routing.shortest_route', 'Shortest Route')}:</span>
                    <span className="text-white ml-2 font-medium">{formatTime(analytics.shortestRoute)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('routing.best_optimization', 'Best Optimization')}:</span>
                    <span className="text-white ml-2 font-medium">{analytics.mostOptimizedScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('routing.needs_improvement', 'Needs Improvement')}:</span>
                    <span className="text-white ml-2 font-medium">{analytics.leastOptimizedScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {routes.length === 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Route className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('routing.no_routes', 'No Routes Generated')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('routing.no_routes_description', 'Generate optimized routes for your teams to get started')}
            </p>
            <Button
              onClick={handleGenerateRoutes}
              disabled={isGenerating}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              {t('routing.generate_first_routes', 'Generate Routes')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}