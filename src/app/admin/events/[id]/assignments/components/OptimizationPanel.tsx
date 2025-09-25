'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Zap, Settings, BarChart3, Clock, Users, Target, Route,
  TrendingUp, CheckCircle, AlertTriangle, Play, RefreshCw
} from 'lucide-react'
import { optimizeTeamAssignments } from '@/server/actions/assignments/optimizeTeamAssignments'

interface OptimizationMetrics {
  totalAssignments: number
  teamsAssigned: number
  stationsUtilized: number
  averageStationsPerTeam: number
  totalEstimatedTime: number
  averageTimePerTeam: number
  difficultyBalance: number
  travelEfficiency: number
}

interface Props {
  eventId: string
  onOptimizationComplete?: () => void
}

type OptimizationStrategy = "balanced" | "shortest_path" | "difficulty_spread" | "time_based"

export function OptimizationPanel({ eventId, onOptimizationComplete }: Props) {
  const { t } = useLanguage()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy>("balanced")
  const [optimizationResults, setOptimizationResults] = useState<{
    metrics: OptimizationMetrics
    strategy: string
  } | null>(null)

  const strategies = [
    {
      value: "balanced" as const,
      name: t('assignments.strategy_balanced', 'Balanced Distribution'),
      description: t('assignments.strategy_balanced_desc', 'Evenly distribute missions across all teams'),
      icon: <Users className="w-4 h-4" />,
      color: "bg-blue-500"
    },
    {
      value: "shortest_path" as const,
      name: t('assignments.strategy_shortest_path', 'Shortest Path'),
      description: t('assignments.strategy_shortest_path_desc', 'Minimize travel time between stations'),
      icon: <Route className="w-4 h-4" />,
      color: "bg-green-500"
    },
    {
      value: "difficulty_spread" as const,
      name: t('assignments.strategy_difficulty', 'Difficulty Spread'),
      description: t('assignments.strategy_difficulty_desc', 'Balance mission difficulty across teams'),
      icon: <Target className="w-4 h-4" />,
      color: "bg-purple-500"
    },
    {
      value: "time_based" as const,
      name: t('assignments.strategy_time', 'Time-Based'),
      description: t('assignments.strategy_time_desc', 'Optimize based on estimated completion times'),
      icon: <Clock className="w-4 h-4" />,
      color: "bg-orange-500"
    }
  ]

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      const result = await optimizeTeamAssignments({
        eventId,
        strategy: selectedStrategy,
        constraints: {
          prioritizeNewStations: true,
          balanceTeamSizes: true,
          respectTravelTime: true
        }
      })

      if (result.ok) {
        setOptimizationResults({
          metrics: result.metrics,
          strategy: result.strategy
        })
        setShowResults(true)
        onOptimizationComplete?.()
      }
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
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

  const getEfficiencyColor = (value: number): string => {
    if (value >= 0.8) return "text-green-400"
    if (value >= 0.6) return "text-yellow-400"
    return "text-red-400"
  }

  const getEfficiencyBadge = (value: number): { text: string, color: string } => {
    if (value >= 0.8) return { text: t('assignments.excellent', 'Excellent'), color: "bg-green-500/20 text-green-400 border-green-500/30" }
    if (value >= 0.6) return { text: t('assignments.good', 'Good'), color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    return { text: t('assignments.needs_improvement', 'Needs Improvement'), color: "bg-red-500/20 text-red-400 border-red-500/30" }
  }

  return (
    <div className="space-y-6">
      {/* Optimization Controls */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-spy-gold" />
            {t('assignments.smart_optimization', 'Smart Assignment Optimization')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('assignments.optimization_description', 'Automatically optimize team assignments using advanced algorithms')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Selection */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
              {t('assignments.optimization_strategy', 'Optimization Strategy')}
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
                    {selectedStrategy === strategy.value && (
                      <CheckCircle className="w-5 h-5 text-spy-gold" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimize Button */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('assignments.optimizing', 'Optimizing...')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('assignments.run_optimization', 'Run Optimization')}
                </>
              )}
            </Button>

            {optimizationResults && (
              <Button
                variant="outline"
                onClick={() => setShowResults(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('assignments.view_results', 'View Results')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-spy-gold" />
              {t('assignments.optimization_results', 'Optimization Results')}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('assignments.results_description', 'Analysis of the optimized team assignments')}
            </DialogDescription>
          </DialogHeader>

          {optimizationResults && (
            <div className="space-y-6">
              {/* Strategy Used */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400">{t('assignments.strategy_used', 'Strategy Used')}:</span>
                  <Badge className="bg-spy-gold/20 text-spy-gold border-spy-gold/30">
                    {strategies.find(s => s.value === optimizationResults.strategy)?.name || optimizationResults.strategy}
                  </Badge>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {optimizationResults.metrics.totalAssignments}
                  </p>
                  <p className="text-xs text-gray-400">{t('assignments.total_assignments', 'Total Assignments')}</p>
                </div>

                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {optimizationResults.metrics.teamsAssigned}
                  </p>
                  <p className="text-xs text-gray-400">{t('assignments.teams_assigned', 'Teams Assigned')}</p>
                </div>

                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {optimizationResults.metrics.stationsUtilized}
                  </p>
                  <p className="text-xs text-gray-400">{t('assignments.stations_used', 'Stations Used')}</p>
                </div>

                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {formatTime(optimizationResults.metrics.averageTimePerTeam)}
                  </p>
                  <p className="text-xs text-gray-400">{t('assignments.avg_time_per_team', 'Avg Time/Team')}</p>
                </div>
              </div>

              {/* Efficiency Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  {t('assignments.efficiency_analysis', 'Efficiency Analysis')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Difficulty Balance */}
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {t('assignments.difficulty_balance', 'Difficulty Balance')}
                      </span>
                      <Badge
                        variant="outline"
                        className={getEfficiencyBadge(optimizationResults.metrics.difficultyBalance).color}
                      >
                        {getEfficiencyBadge(optimizationResults.metrics.difficultyBalance).text}
                      </Badge>
                    </div>
                    <Progress
                      value={optimizationResults.metrics.difficultyBalance * 100}
                      className="h-2 mb-1"
                    />
                    <p className="text-xs text-gray-400">
                      {Math.round(optimizationResults.metrics.difficultyBalance * 100)}% balanced across teams
                    </p>
                  </div>

                  {/* Travel Efficiency */}
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {t('assignments.travel_efficiency', 'Travel Efficiency')}
                      </span>
                      <Badge
                        variant="outline"
                        className={getEfficiencyBadge(optimizationResults.metrics.travelEfficiency).color}
                      >
                        {getEfficiencyBadge(optimizationResults.metrics.travelEfficiency).text}
                      </Badge>
                    </div>
                    <Progress
                      value={optimizationResults.metrics.travelEfficiency * 100}
                      className="h-2 mb-1"
                    />
                    <p className="text-xs text-gray-400">
                      {Math.round(optimizationResults.metrics.travelEfficiency * 100)}% optimized routes
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">
                  {t('assignments.additional_insights', 'Additional Insights')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">{t('assignments.avg_stations_per_team', 'Avg Stations/Team')}:</span>
                    <span className="text-white ml-2 font-medium">
                      {optimizationResults.metrics.averageStationsPerTeam.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('assignments.total_estimated_time', 'Total Estimated Time')}:</span>
                    <span className="text-white ml-2 font-medium">
                      {formatTime(optimizationResults.metrics.totalEstimatedTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">
                  {t('assignments.optimization_complete', 'Optimization completed successfully!')}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResults(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}