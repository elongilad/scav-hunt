'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  FileText, Download, Mail, Calendar, TrendingUp, Users,
  BarChart3, Settings, RefreshCw, Share
} from 'lucide-react'
import { ExecutiveSummary } from './ExecutiveSummary'
import { DetailedAnalytics } from './DetailedAnalytics'
import { AutomatedInsights } from './AutomatedInsights'
import { ExportTools } from './ExportTools'
import { ReportScheduler } from './ReportScheduler'
import { CustomReportBuilder } from './CustomReportBuilder'

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

export function EventReportsClient({ eventId, eventData }: Props) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('summary')
  const [isLoading, setIsLoading] = useState(true)
  const [lastGenerated, setLastGenerated] = useState<Date>(new Date())
  const supabase = createClientComponentClient()

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const refreshReports = async () => {
    setIsLoading(true)
    // Simulate report regeneration
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLastGenerated(new Date())
    setIsLoading(false)
  }

  const reportCategories = [
    {
      key: 'summary',
      label: t('reports.executive_summary', 'Executive Summary'),
      icon: FileText,
      description: 'High-level overview and key metrics'
    },
    {
      key: 'analytics',
      label: t('reports.detailed_analytics', 'Detailed Analytics'),
      icon: BarChart3,
      description: 'In-depth performance analysis'
    },
    {
      key: 'insights',
      label: t('reports.automated_insights', 'AI Insights'),
      icon: TrendingUp,
      description: 'AI-powered recommendations and trends'
    },
    {
      key: 'export',
      label: t('reports.export_tools', 'Export & Share'),
      icon: Download,
      description: 'Export and sharing options'
    },
    {
      key: 'schedule',
      label: t('reports.schedule', 'Automated Reports'),
      icon: Calendar,
      description: 'Schedule automated report generation'
    },
    {
      key: 'custom',
      label: t('reports.custom_builder', 'Custom Reports'),
      icon: Settings,
      description: 'Build custom reports and dashboards'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
        <span className="ml-3 text-gray-400">Generating reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Report Actions Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-white font-medium">Event Reports</h3>
            <p className="text-sm text-gray-400">
              Last generated: {lastGenerated.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              eventData.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-400">
              Event {eventData.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshReports}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('reports.refresh', 'Refresh')}
          </Button>
          <Button
            size="sm"
            className="bg-spy-gold hover:bg-spy-gold/90 text-black"
          >
            <Share className="w-4 h-4 mr-2" />
            {t('reports.share', 'Share')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/10 border-white/20">
          {reportCategories.map((category) => (
            <TabsTrigger
              key={category.key}
              value={category.key}
              className="flex items-center gap-2 text-xs lg:text-sm"
              title={category.description}
            >
              <category.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <ExecutiveSummary eventId={eventId} eventData={eventData} />
        </TabsContent>

        {/* Detailed Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <DetailedAnalytics eventId={eventId} />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <AutomatedInsights eventId={eventId} />
        </TabsContent>

        {/* Export & Share Tab */}
        <TabsContent value="export" className="space-y-6">
          <ExportTools eventId={eventId} eventData={eventData} />
        </TabsContent>

        {/* Automated Reports Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <ReportScheduler eventId={eventId} />
        </TabsContent>

        {/* Custom Report Builder Tab */}
        <TabsContent value="custom" className="space-y-6">
          <CustomReportBuilder eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}