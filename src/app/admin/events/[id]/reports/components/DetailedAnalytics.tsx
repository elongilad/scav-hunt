'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { TeamPerformanceAnalytics } from '../../analytics/components/TeamPerformanceAnalytics'
import { StationAnalytics } from '../../analytics/components/StationAnalytics'
import { TimeAnalytics } from '../../analytics/components/TimeAnalytics'

interface Props {
  eventId: string
}

export function DetailedAnalytics({ eventId }: Props) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detailed Analytics Report
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive performance analysis with detailed metrics
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPerformanceAnalytics eventId={eventId} />
        <StationAnalytics eventId={eventId} />
      </div>
      
      <TimeAnalytics eventId={eventId} />
    </div>
  )
}