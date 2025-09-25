'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { Activity, Users, MessageCircle, Heart, TrendingUp, PieChart } from 'lucide-react'

interface Props {
  eventId: string
}

interface EngagementData {
  participationRate: number
  averageEngagementTime: number
  interactionCount: number
  retentionRate: number
  satisfactionScore: number
  engagementTrend: Array<{ time: string; score: number }>
  categories: {
    highly_engaged: number
    moderately_engaged: number
    low_engagement: number
    inactive: number
  }
}

export function EngagementMetrics({ eventId }: Props) {
  const { t } = useLanguage()
  const [data, setData] = useState<EngagementData>({
    participationRate: 0,
    averageEngagementTime: 0,
    interactionCount: 0,
    retentionRate: 0,
    satisfactionScore: 0,
    engagementTrend: [],
    categories: { highly_engaged: 0, moderately_engaged: 0, low_engagement: 0, inactive: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadEngagementData()
  }, [eventId])

  const loadEngagementData = async () => {
    try {
      // Mock engagement data
      const engagementTrend = Array.from({ length: 12 }, (_, i) => ({
        time: `${i + 1}:00`,
        score: Math.random() * 40 + 60
      }))

      setData({
        participationRate: 87.5,
        averageEngagementTime: 45,
        interactionCount: 234,
        retentionRate: 92.3,
        satisfactionScore: 4.7,
        engagementTrend,
        categories: {
          highly_engaged: 35,
          moderately_engaged: 28,
          low_engagement: 15,
          inactive: 8
        }
      })
    } catch (error) {
      console.error('Error loading engagement data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading engagement metrics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Engagement Metrics
        </CardTitle>
        <CardDescription className="text-gray-400">
          User engagement and interaction analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-xl font-bold text-white">{data.participationRate}%</div>
            <div className="text-xs text-gray-400">Participation</div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-xl font-bold text-white">{data.interactionCount}</div>
            <div className="text-xs text-gray-400">Interactions</div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-xl font-bold text-white">{data.retentionRate}%</div>
            <div className="text-xs text-gray-400">Retention</div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <Heart className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <div className="text-xl font-bold text-white">{data.satisfactionScore}/5</div>
            <div className="text-xs text-gray-400">Satisfaction</div>
          </div>
        </div>

        {/* Engagement Trend */}
        <div>
          <h4 className="text-white font-medium mb-3">Engagement Trend</h4>
          <div className="flex items-end gap-2 h-24">
            {data.engagementTrend.map((point, index) => {
              const height = (point.score / 100) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-spy-gold/60 w-full rounded-sm mb-1"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-400">{point.time}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Engagement Categories */}
        <div>
          <h4 className="text-white font-medium mb-3">Engagement Distribution</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-300 text-sm">Highly Engaged</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(data.categories.highly_engaged / 86) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.categories.highly_engaged}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-gray-300 text-sm">Moderately Engaged</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(data.categories.moderately_engaged / 86) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.categories.moderately_engaged}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-gray-300 text-sm">Low Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(data.categories.low_engagement / 86) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.categories.low_engagement}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                <span className="text-gray-300 text-sm">Inactive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full"
                    style={{ width: `${(data.categories.inactive / 86) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm w-8">{data.categories.inactive}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="p-4 bg-spy-gold/10 border border-spy-gold/20 rounded-lg">
          <h4 className="text-spy-gold font-medium mb-2">Key Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-1 h-1 bg-spy-gold rounded-full" />
              <span>Participation rate is above average at {data.participationRate}%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-1 h-1 bg-spy-gold rounded-full" />
              <span>High satisfaction score indicates positive user experience</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-1 h-1 bg-spy-gold rounded-full" />
              <span>Retention rate of {data.retentionRate}% shows strong event engagement</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}