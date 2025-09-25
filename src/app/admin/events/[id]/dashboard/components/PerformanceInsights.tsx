'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target,
  BarChart3, PieChart, Activity, Zap, Clock, Users, Award
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
    systemHealth: number
  }
}

interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
  recommendation?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface PerformanceMetrics {
  participationRate: number
  completionRate: number
  averageSessionTime: number
  stationUtilization: number
  teamEfficiency: number
  systemLoad: number
}

export function PerformanceInsights({ eventId, stats }: Props) {
  const { t } = useLanguage()
  const [insights, setInsights] = useState<Insight[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    participationRate: 0,
    completionRate: 0,
    averageSessionTime: 0,
    stationUtilization: 0,
    teamEfficiency: 0,
    systemLoad: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'performance' | 'engagement' | 'issues'>('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    analyzePerformance()
    const interval = setInterval(analyzePerformance, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [eventId, stats])

  const analyzePerformance = async () => {
    try {
      // Calculate performance metrics
      const participationRate = stats.totalTeams > 0 ? (stats.activeTeams / stats.totalTeams) * 100 : 0
      const completionRate = stats.totalTeams > 0 ? (stats.completedTeams / stats.totalTeams) * 100 : 0
      const stationUtilization = stats.totalStations > 0 ? (stats.activeStations / stats.totalStations) * 100 : 0

      // Get session time data
      const { data: sessionData } = await supabase
        .from('hunt_teams')
        .select('start_time, finish_time')
        .eq('event_id', eventId)
        .not('start_time', 'is', null)

      let averageSessionTime = 0
      if (sessionData && sessionData.length > 0) {
        const completedSessions = sessionData.filter(s => s.finish_time)
        if (completedSessions.length > 0) {
          const totalTime = completedSessions.reduce((sum, session) => {
            const start = new Date(session.start_time!).getTime()
            const end = new Date(session.finish_time!).getTime()
            return sum + (end - start)
          }, 0)
          averageSessionTime = totalTime / completedSessions.length / (1000 * 60) // Convert to minutes
        }
      }

      // Calculate team efficiency (visits per active team)
      const teamEfficiency = stats.activeTeams > 0 ? stats.totalVisits / stats.activeTeams : 0

      // System load (simplified based on events per minute and active teams)
      const systemLoad = Math.min(100, (stats.activeTeams * 2) + (stats.totalVisits / 100))

      const newMetrics: PerformanceMetrics = {
        participationRate,
        completionRate,
        averageSessionTime,
        stationUtilization,
        teamEfficiency,
        systemLoad
      }

      setMetrics(newMetrics)

      // Generate insights based on metrics
      const generatedInsights = generateInsights(newMetrics, stats)
      setInsights(generatedInsights)

    } catch (error) {
      console.error('Error analyzing performance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateInsights = (metrics: PerformanceMetrics, stats: any): Insight[] => {
    const insights: Insight[] = []

    // Participation insights
    if (metrics.participationRate > 80) {
      insights.push({
        id: 'high_participation',
        type: 'positive',
        title: 'Excellent Participation',
        description: `${metrics.participationRate.toFixed(1)}% of teams are actively participating`,
        value: `${stats.activeTeams}/${stats.totalTeams}`,
        priority: 'medium',
        recommendation: 'Great engagement! Monitor for any teams that might need assistance.'
      })
    } else if (metrics.participationRate < 50) {
      insights.push({
        id: 'low_participation',
        type: 'warning',
        title: 'Low Participation Rate',
        description: `Only ${metrics.participationRate.toFixed(1)}% of teams are currently active`,
        value: `${stats.activeTeams}/${stats.totalTeams}`,
        priority: 'high',
        recommendation: 'Consider sending encouragement messages or checking for technical issues.'
      })
    }

    // Completion rate insights
    if (metrics.completionRate > 50) {
      insights.push({
        id: 'good_completion',
        type: 'positive',
        title: 'Strong Completion Rate',
        description: `${metrics.completionRate.toFixed(1)}% of teams have completed the hunt`,
        value: `${stats.completedTeams} teams`,
        priority: 'low'
      })
    } else if (metrics.completionRate > 0 && metrics.averageSessionTime > 0) {
      const projectedTime = metrics.averageSessionTime / (metrics.completionRate / 100)
      insights.push({
        id: 'completion_projection',
        type: 'neutral',
        title: 'Completion Tracking',
        description: `Based on current pace, average completion time is projected at ${Math.round(projectedTime)} minutes`,
        priority: 'medium'
      })
    }

    // Station utilization insights
    if (metrics.stationUtilization < 70) {
      insights.push({
        id: 'underutilized_stations',
        type: 'warning',
        title: 'Underutilized Stations',
        description: `${(100 - metrics.stationUtilization).toFixed(1)}% of stations are inactive`,
        value: `${stats.totalStations - stats.activeStations} inactive`,
        priority: 'medium',
        recommendation: 'Check inactive stations for technical issues or accessibility problems.'
      })
    }

    // Team efficiency insights
    if (metrics.teamEfficiency > 3) {
      insights.push({
        id: 'high_efficiency',
        type: 'positive',
        title: 'High Team Efficiency',
        description: `Teams are averaging ${metrics.teamEfficiency.toFixed(1)} station visits each`,
        priority: 'low'
      })
    } else if (metrics.teamEfficiency < 1.5 && stats.activeTeams > 0) {
      insights.push({
        id: 'low_efficiency',
        type: 'negative',
        title: 'Low Team Progress',
        description: `Teams are averaging only ${metrics.teamEfficiency.toFixed(1)} station visits`,
        priority: 'high',
        recommendation: 'Teams may be stuck. Consider providing hints or assistance.'
      })
    }

    // System performance insights
    if (stats.systemHealth < 85) {
      insights.push({
        id: 'system_issues',
        type: 'negative',
        title: 'System Performance Issues',
        description: `System health is at ${stats.systemHealth}%`,
        priority: 'critical',
        recommendation: 'Monitor system resources and check for connection issues.'
      })
    }

    // Time-based insights
    if (metrics.averageSessionTime > 120) {
      insights.push({
        id: 'long_sessions',
        type: 'warning',
        title: 'Extended Session Times',
        description: `Average completion time is ${Math.round(metrics.averageSessionTime)} minutes`,
        priority: 'medium',
        recommendation: 'Consider if the hunt difficulty is appropriate or if teams need more guidance.'
      })
    }

    // Progress insights
    if (stats.averageProgress > 75) {
      insights.push({
        id: 'good_progress',
        type: 'positive',
        title: 'Strong Overall Progress',
        description: `Teams are averaging ${stats.averageProgress}% completion`,
        priority: 'low'
      })
    } else if (stats.averageProgress < 25 && stats.activeTeams > 0) {
      insights.push({
        id: 'slow_progress',
        type: 'warning',
        title: 'Slow Progress Detected',
        description: `Teams are averaging only ${stats.averageProgress}% completion`,
        priority: 'high',
        recommendation: 'Teams may need additional support or clearer instructions.'
      })
    }

    // Congestion insights
    if (metrics.systemLoad > 80) {
      insights.push({
        id: 'high_load',
        type: 'warning',
        title: 'High System Load',
        description: `System is operating at ${metrics.systemLoad.toFixed(1)}% capacity`,
        priority: 'high',
        recommendation: 'Monitor for potential performance bottlenecks.'
      })
    }

    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default: return <Activity className="w-4 h-4 text-blue-400" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-500 bg-green-500/10'
      case 'negative': return 'border-red-500 bg-red-500/10'
      case 'warning': return 'border-yellow-500 bg-yellow-500/10'
      default: return 'border-blue-500 bg-blue-500/10'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive" className="text-xs">Critical</Badge>
      case 'high': return <Badge className="bg-orange-500 text-white text-xs">High</Badge>
      case 'medium': return <Badge className="bg-yellow-500 text-black text-xs">Medium</Badge>
      default: return <Badge variant="outline" className="text-xs">Low</Badge>
    }
  }

  const getFilteredInsights = () => {
    switch (selectedCategory) {
      case 'performance':
        return insights.filter(i => ['high_efficiency', 'low_efficiency', 'system_issues', 'high_load'].includes(i.id))
      case 'engagement':
        return insights.filter(i => ['high_participation', 'low_participation', 'good_completion', 'good_progress', 'slow_progress'].includes(i.id))
      case 'issues':
        return insights.filter(i => i.type === 'negative' || i.type === 'warning')
      default:
        return insights
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Analyzing performance...</span>
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
              <BarChart3 className="w-5 h-5" />
              {t('dashboard.performance_insights', 'Performance Insights')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('dashboard.ai_powered_recommendations', 'AI-powered analysis and recommendations')}
            </CardDescription>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'performance', label: 'Performance' },
            { key: 'engagement', label: 'Engagement' },
            { key: 'issues', label: 'Issues' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={selectedCategory === key ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(key as any)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-lg font-bold text-green-400">
              {metrics.participationRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Participation</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-400">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Completion</div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <div className="text-lg font-bold text-spy-gold">
              {metrics.teamEfficiency.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400">Avg Visits/Team</div>
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {getFilteredInsights().map(insight => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(insight.priority)}
                      {insight.value && (
                        <span className="text-xs text-gray-400">{insight.value}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 mb-2">
                    {insight.description}
                  </p>

                  {insight.recommendation && (
                    <div className="p-2 bg-white/5 rounded text-xs text-gray-400 border-l-2 border-spy-gold/50">
                      <strong className="text-spy-gold">Recommendation:</strong> {insight.recommendation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {getFilteredInsights().length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No insights available in this category</div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Overall Event Health</div>
            <div className="flex items-center justify-center gap-2">
              <div className={`text-lg font-bold ${
                stats.systemHealth >= 90 ? 'text-green-400' :
                stats.systemHealth >= 75 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.systemHealth}%
              </div>
              <div className="flex items-center text-xs text-gray-400">
                {insights.filter(i => i.type === 'positive').length > insights.filter(i => i.type === 'negative' || i.type === 'warning').length ?
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" /> :
                  <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                }
                {insights.length} insights generated
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}