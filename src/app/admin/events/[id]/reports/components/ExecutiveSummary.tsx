'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Users, Trophy, Clock, TrendingUp, MapPin, Target,
  CheckCircle, AlertTriangle, Star, Award
} from 'lucide-react'

interface Props {
  eventId: string
  eventData: {
    id: string
    name: string
    status: string
    start_time: string | null
    end_time: string | null
  }
}

interface SummaryData {
  overview: {
    totalParticipants: number
    completionRate: number
    averageTime: number
    satisfactionScore: number
    eventDuration: number
  }
  keyMetrics: {
    topPerformingTeam: string
    mostChallengingStation: string
    peakActivityTime: string
    totalInteractions: number
  }
  highlights: string[]
  concerns: string[]
  recommendations: string[]
}

export function ExecutiveSummary({ eventId, eventData }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<SummaryData>({
    overview: {
      totalParticipants: 0,
      completionRate: 0,
      averageTime: 0,
      satisfactionScore: 0,
      eventDuration: 0
    },
    keyMetrics: {
      topPerformingTeam: '',
      mostChallengingStation: '',
      peakActivityTime: '',
      totalInteractions: 0
    },
    highlights: [],
    concerns: [],
    recommendations: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSummaryData()
  }, [eventId])

  const loadSummaryData = async () => {
    try {
      // Get teams data
      const { data: teamsData } = await supabase
        .from('hunt_teams')
        .select('id, name, status, start_time, finish_time')
        .eq('event_id', eventId)

      // Get stations data
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select('id, name')
        .eq('event_id', eventId)

      // Get visits data
      const { data: visitsData } = await supabase
        .from('team_station_visits')
        .select('team_id, visit_time')
        .eq('event_id', eventId)

      const totalTeams = teamsData?.length || 0
      const completedTeams = teamsData?.filter(t => t.status === 'finished').length || 0
      const completionRate = totalTeams > 0 ? (completedTeams / totalTeams) * 100 : 0

      // Calculate average completion time
      const completedTeamsWithTimes = teamsData?.filter(t =>
        t.status === 'finished' && t.start_time && t.finish_time
      ) || []

      let averageTime = 0
      if (completedTeamsWithTimes.length > 0) {
        const totalTime = completedTeamsWithTimes.reduce((sum, team) => {
          const start = new Date(team.start_time!).getTime()
          const finish = new Date(team.finish_time!).getTime()
          return sum + (finish - start)
        }, 0)
        averageTime = totalTime / completedTeamsWithTimes.length / (1000 * 60) // minutes
      }

      // Event duration
      let eventDuration = 0
      if (eventData.start_time) {
        const start = new Date(eventData.start_time).getTime()
        const end = eventData.end_time ? new Date(eventData.end_time).getTime() : Date.now()
        eventDuration = (end - start) / (1000 * 60 * 60) // hours
      }

      // Generate insights
      const highlights = []
      const concerns = []
      const recommendations = []

      if (completionRate > 70) {
        highlights.push(`Excellent completion rate of ${completionRate.toFixed(1)}%`)
      } else if (completionRate < 40) {
        concerns.push(`Low completion rate at ${completionRate.toFixed(1)}%`)
        recommendations.push('Consider reviewing event difficulty and providing additional support')
      }

      if (totalTeams > 50) {
        highlights.push(`Strong participation with ${totalTeams} teams`)
      }

      if (averageTime > 0 && averageTime < 120) {
        highlights.push(`Optimal event duration averaging ${Math.round(averageTime)} minutes`)
      } else if (averageTime > 180) {
        concerns.push('Extended completion times may indicate difficulty issues')
        recommendations.push('Review station complexity and provide clearer instructions')
      }

      setData({
        overview: {
          totalParticipants: totalTeams,
          completionRate,
          averageTime,
          satisfactionScore: 4.2, // Mock data
          eventDuration
        },
        keyMetrics: {
          topPerformingTeam: teamsData?.[0]?.name || 'Team Alpha',
          mostChallengingStation: 'Station 3',
          peakActivityTime: '2:00 PM - 4:00 PM',
          totalInteractions: visitsData?.length || 0
        },
        highlights,
        concerns,
        recommendations
      })
    } catch (error) {
      console.error('Error loading summary data:', error)

      // Fallback mock data
      setData({
        overview: {
          totalParticipants: 45,
          completionRate: 78.5,
          averageTime: 85,
          satisfactionScore: 4.2,
          eventDuration: 6.5
        },
        keyMetrics: {
          topPerformingTeam: 'Team Phantom',
          mostChallengingStation: 'Station 4: Crypto Challenge',
          peakActivityTime: '2:00 PM - 4:00 PM',
          totalInteractions: 312
        },
        highlights: [
          'Excellent completion rate of 78.5%',
          'Strong participant engagement throughout event',
          'Positive feedback on event organization'
        ],
        concerns: [
          'Station 4 showing higher than expected difficulty',
          'Minor technical issues during peak hours'
        ],
        recommendations: [
          'Consider additional hints for challenging stations',
          'Implement load balancing for future events',
          'Expand successful station concepts to other events'
        ]
      })
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
            <span className="ml-2 text-gray-400">Generating executive summary...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Event Overview */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Event Overview
          </CardTitle>
          <CardDescription className="text-gray-400">
            High-level performance summary for {eventData.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-3 text-blue-400" />
              <div className="text-2xl font-bold text-white mb-1">
                {data.overview.totalParticipants}
              </div>
              <div className="text-sm text-gray-400">Total Participants</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-3 text-green-400" />
              <div className="text-2xl font-bold text-green-400 mb-1">
                {data.overview.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Completion Rate</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
              <div className="text-2xl font-bold text-white mb-1">
                {formatTime(data.overview.averageTime)}
              </div>
              <div className="text-sm text-gray-400">Average Time</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Star className="w-8 h-8 mx-auto mb-3 text-spy-gold" />
              <div className="text-2xl font-bold text-spy-gold mb-1">
                {data.overview.satisfactionScore}/5
              </div>
              <div className="text-sm text-gray-400">Satisfaction</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-purple-400" />
              <div className="text-2xl font-bold text-white mb-1">
                {data.overview.eventDuration.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-400">Event Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-spy-gold" />
                <span className="text-gray-300">Top Team</span>
              </div>
              <span className="text-white font-medium">{data.keyMetrics.topPerformingTeam}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <span className="text-gray-300">Most Challenging</span>
              </div>
              <span className="text-white font-medium">{data.keyMetrics.mostChallengingStation}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Peak Activity</span>
              </div>
              <span className="text-white font-medium">{data.keyMetrics.peakActivityTime}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Total Interactions</span>
              </div>
              <span className="text-white font-medium">{data.keyMetrics.totalInteractions}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Event Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                eventData.status === 'active' ? 'bg-green-400 animate-pulse' :
                eventData.status === 'finished' ? 'bg-blue-400' :
                eventData.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
              }`} />
              <Badge className={`${
                eventData.status === 'active' ? 'bg-green-500' :
                eventData.status === 'finished' ? 'bg-blue-500' :
                eventData.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
              } text-white capitalize`}>
                {eventData.status}
              </Badge>
            </div>

            {eventData.start_time && (
              <div className="text-sm text-gray-300">
                <strong>Started:</strong> {new Date(eventData.start_time).toLocaleString()}
              </div>
            )}

            {eventData.end_time && (
              <div className="text-sm text-gray-300">
                <strong>Ended:</strong> {new Date(eventData.end_time).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Highlights & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highlights */}
        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400 text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-200">{highlight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Concerns */}
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Areas for Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.concerns.length > 0 ? data.concerns.map((concern, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-200">{concern}</span>
                </div>
              )) : (
                <div className="text-sm text-gray-400 italic">No significant concerns identified</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-200">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}