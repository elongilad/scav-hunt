'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, Mail, Settings } from 'lucide-react'

interface Props {
  eventId: string
}

interface ScheduledReport {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  enabled: boolean
  lastRun: string
  nextRun: string
  recipients: string[]
}

export function ReportScheduler({ eventId }: Props) {
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Daily Performance Summary',
      frequency: 'daily',
      enabled: true,
      lastRun: '2024-01-15 08:00',
      nextRun: '2024-01-16 08:00',
      recipients: ['admin@example.com', 'manager@example.com']
    },
    {
      id: '2',
      name: 'Weekly Analytics Report',
      frequency: 'weekly',
      enabled: false,
      lastRun: '2024-01-08 09:00',
      nextRun: '2024-01-15 09:00',
      recipients: ['stakeholders@example.com']
    }
  ])

  const toggleReport = (id: string) => {
    setReports(prev => prev.map(report =>
      report.id === id ? { ...report, enabled: !report.enabled } : report
    ))
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-500'
      case 'weekly': return 'bg-blue-500'
      case 'monthly': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Automated Report Scheduling
          </CardTitle>
          <CardDescription className="text-gray-400">
            Set up automatic report generation and delivery
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Existing Scheduled Reports */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Scheduled Reports</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your automated report schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={report.enabled}
                    onCheckedChange={() => toggleReport(report.id)}
                  />
                  <div className={`w-2 h-2 rounded-full ${
                    report.enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{report.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getFrequencyColor(report.frequency)} text-white text-xs`}>
                      {report.frequency}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {report.recipients.length} recipients
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Next run: {report.nextRun}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="bg-spy-gold hover:bg-spy-gold/90 text-black"
                >
                  Run Now
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Setup Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-3 text-green-400" />
            <h3 className="text-white font-medium mb-2">Daily Reports</h3>
            <p className="text-sm text-gray-400 mb-4">
              Receive daily performance summaries every morning
            </p>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              Set Up Daily
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-3 text-blue-400" />
            <h3 className="text-white font-medium mb-2">Weekly Digest</h3>
            <p className="text-sm text-gray-400 mb-4">
              Comprehensive weekly analytics and insights
            </p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Set Up Weekly
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <Mail className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <h3 className="text-white font-medium mb-2">Custom Schedule</h3>
            <p className="text-sm text-gray-400 mb-4">
              Create custom reporting schedules for specific needs
            </p>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
              Custom Setup
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Automation Status */}
      <Card className="bg-gradient-to-r from-spy-gold/10 to-white/5 border-spy-gold/20">
        <CardHeader>
          <CardTitle className="text-spy-gold text-lg">Automation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {reports.filter(r => r.enabled).length}
              </div>
              <div className="text-sm text-gray-400">Active Schedules</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {reports.reduce((sum, r) => sum + r.recipients.length, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Recipients</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-spy-gold mb-1">
                24/7
              </div>
              <div className="text-sm text-gray-400">Monitoring</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}