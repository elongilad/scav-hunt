'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  BarChart3, TrendingUp, Users, Clock, MapPin, Trophy,
  Target, Activity, PieChart, LineChart
} from 'lucide-react'
import { TeamPerformanceAnalytics } from './TeamPerformanceAnalytics'
import { StationAnalytics } from './StationAnalytics'
import { TimeAnalytics } from './TimeAnalytics'
import { EngagementMetrics } from './EngagementMetrics'
import { CompletionFunnel } from './CompletionFunnel'
import { HeatmapVisualization } from './HeatmapVisualization'

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

export function EventAnalyticsClient({ eventId, eventData }: Props) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const analyticsCategories = [
    {
      key: 'overview',
      label: t('analytics.overview', 'Overview'),
      icon: BarChart3,
      description: 'General performance metrics and KPIs'
    },
    {
      key: 'teams',
      label: t('analytics.team_performance', 'Team Performance'),
      icon: Users,
      description: 'Individual team analytics and comparisons'
    },
    {
      key: 'stations',
      label: t('analytics.station_analysis', 'Station Analysis'),
      icon: MapPin,
      description: 'Station difficulty and engagement metrics'
    },
    {
      key: 'timing',
      label: t('analytics.timing_analysis', 'Timing Analysis'),
      icon: Clock,
      description: 'Time-based patterns and completion rates'
    },
    {
      key: 'engagement',
      label: t('analytics.engagement', 'Engagement'),
      icon: Activity,
      description: 'User interaction and participation metrics'
    },
    {
      key: 'funnel',
      label: t('analytics.completion_funnel', 'Completion Funnel'),
      icon: Target,
      description: 'Step-by-step progression analysis'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
        <span className="ml-3 text-gray-400">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/10 border-white/20">
          {analyticsCategories.map((category) => (
            <TabsTrigger
              key={category.key}
              value={category.key}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <category.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementMetrics eventId={eventId} />
            <CompletionFunnel eventId={eventId} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TeamPerformanceAnalytics eventId={eventId} compact />
            <StationAnalytics eventId={eventId} compact />
            <TimeAnalytics eventId={eventId} compact />
          </div>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="teams" className="space-y-6">
          <TeamPerformanceAnalytics eventId={eventId} />
        </TabsContent>

        {/* Station Analysis Tab */}
        <TabsContent value="stations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StationAnalytics eventId={eventId} />
            <HeatmapVisualization eventId={eventId} />
          </div>
        </TabsContent>

        {/* Timing Analysis Tab */}
        <TabsContent value="timing" className="space-y-6">
          <TimeAnalytics eventId={eventId} />
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <EngagementMetrics eventId={eventId} />
        </TabsContent>

        {/* Completion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <CompletionFunnel eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}