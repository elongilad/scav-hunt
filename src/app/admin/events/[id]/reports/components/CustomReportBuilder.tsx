'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Settings, Plus, BarChart3, Users, MapPin, Clock } from 'lucide-react'

interface Props {
  eventId: string
}

interface ReportSection {
  id: string
  name: string
  description: string
  icon: any
  enabled: boolean
}

export function CustomReportBuilder({ eventId }: Props) {
  const [sections, setSections] = useState<ReportSection[]>([
    {
      id: 'overview',
      name: 'Executive Overview',
      description: 'High-level KPIs and summary statistics',
      icon: BarChart3,
      enabled: true
    },
    {
      id: 'teams',
      name: 'Team Performance',
      description: 'Individual team analytics and rankings',
      icon: Users,
      enabled: true
    },
    {
      id: 'stations',
      name: 'Station Analysis',
      description: 'Station difficulty and completion rates',
      icon: MapPin,
      enabled: false
    },
    {
      id: 'timing',
      name: 'Time Analytics',
      description: 'Activity patterns and completion times',
      icon: Clock,
      enabled: true
    }
  ])

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(section =>
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ))
  }

  const generateReport = () => {
    const enabledSections = sections.filter(s => s.enabled)
    console.log('Generating custom report with sections:', enabledSections.map(s => s.name))
    // Implementation would generate the custom report
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Custom Report Builder
          </CardTitle>
          <CardDescription className="text-gray-400">
            Build tailored reports with specific sections and metrics
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Report Sections */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Report Sections</CardTitle>
          <CardDescription className="text-gray-400">
            Select which sections to include in your custom report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map(section => {
            const IconComponent = section.icon
            return (
              <div
                key={section.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  section.enabled
                    ? 'bg-spy-gold/10 border-spy-gold/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <div className={`p-2 rounded-lg ${
                    section.enabled ? 'bg-spy-gold text-black' : 'bg-white/20 text-white'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{section.name}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
                <Badge className={section.enabled ? 'bg-green-500' : 'bg-gray-500'}>
                  {section.enabled ? 'Included' : 'Excluded'}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card className="bg-gradient-to-r from-spy-gold/10 to-white/5 border-spy-gold/20">
        <CardHeader>
          <CardTitle className="text-spy-gold text-lg">Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <p className="text-white font-medium">Your custom report will include:</p>
            {sections.filter(s => s.enabled).map(section => (
              <div key={section.id} className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1 h-1 bg-spy-gold rounded-full" />
                {section.name}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={generateReport}
              disabled={sections.filter(s => s.enabled).length === 0}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black"
            >
              Generate Report
            </Button>
            <div className="text-sm text-gray-400">
              {sections.filter(s => s.enabled).length} sections selected
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Templates</CardTitle>
          <CardDescription className="text-gray-400">
            Use pre-configured report templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-5 h-5" />
              <span>Executive Summary</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-5 h-5" />
              <span>Detailed Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}