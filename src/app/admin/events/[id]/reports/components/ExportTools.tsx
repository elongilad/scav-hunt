'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Mail, Share2, Printer, FileSpreadsheet } from 'lucide-react'

interface Props {
  eventId: string
  eventData: {
    id: string
    name: string
    status: string
  }
}

export function ExportTools({ eventId, eventData }: Props) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExport = async (type: string) => {
    setIsExporting(type)
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real implementation, this would generate and download the file
    console.log(`Exporting ${type} for event ${eventId}`)
    
    setIsExporting(null)
  }

  const exportOptions = [
    {
      id: 'pdf',
      title: 'Executive Report (PDF)',
      description: 'Complete executive summary with charts and insights',
      icon: FileText,
      format: 'PDF',
      color: 'bg-red-500'
    },
    {
      id: 'excel',
      title: 'Raw Data Export (Excel)',
      description: 'All event data including team performance and station visits',
      icon: FileSpreadsheet,
      format: 'XLSX',
      color: 'bg-green-500'
    },
    {
      id: 'csv',
      title: 'Analytics Data (CSV)',
      description: 'Clean data export for further analysis',
      icon: FileSpreadsheet,
      format: 'CSV',
      color: 'bg-blue-500'
    }
  ]

  const shareOptions = [
    {
      id: 'email',
      title: 'Email Report',
      description: 'Send executive summary via email',
      icon: Mail,
      action: 'Send'
    },
    {
      id: 'link',
      title: 'Shareable Link',
      description: 'Generate a secure link to view the report',
      icon: Share2,
      action: 'Generate'
    },
    {
      id: 'print',
      title: 'Print Report',
      description: 'Optimized print version of the executive summary',
      icon: Printer,
      action: 'Print'
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export & Share Tools
          </CardTitle>
          <CardDescription className="text-gray-400">
            Download reports in various formats or share with stakeholders
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Export Options */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Download Reports</CardTitle>
          <CardDescription className="text-gray-400">
            Export comprehensive reports in your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportOptions.map(option => {
            const IconComponent = option.icon
            const isLoading = isExporting === option.id

            return (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${option.color} text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{option.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                    <Badge className="mt-2 bg-white/20 text-gray-300 text-xs">
                      {option.format}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handleExport(option.id)}
                  disabled={isLoading}
                  className="bg-spy-gold hover:bg-spy-gold/90 text-black"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Generating...' : 'Download'}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Share Options */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Share Reports</CardTitle>
          <CardDescription className="text-gray-400">
            Share insights with team members and stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareOptions.map(option => {
            const IconComponent = option.icon

            return (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-white/20 text-white">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{option.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {option.action}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-spy-gold/10 to-white/5 border-spy-gold/20">
        <CardHeader>
          <CardTitle className="text-spy-gold text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              size="lg"
              className="bg-spy-gold hover:bg-spy-gold/90 text-black h-16 flex flex-col gap-1"
              onClick={() => handleExport('pdf')}
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">Download Executive Summary</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-16 flex flex-col gap-1"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm">Email to Stakeholders</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}