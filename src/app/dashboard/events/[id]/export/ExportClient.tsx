'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download,
  QrCode,
  FileText,
  Printer,
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ExportClientProps {
  eventData: {
    id: string
    name: string
    child_name: string
    date_start: string
    status: string
    hunt_models: {
      name: string
      model_stations: Array<{
        station_id: string
        display_name: string
        station_type: string
        location_hint?: string
      }>
    }
    teams: Array<{
      id: string
      name: string
      status: string
      participants: string[]
    }>
  }
}

export default function ExportClient({ eventData }: ExportClientProps) {
  const [exportOptions, setExportOptions] = useState({
    stationQRs: true,
    eventSummary: true,
    teamList: true,
    setupGuide: true
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const generateQRCodeData = (stationId: string, teamId?: string) => {
    const baseUrl = window.location.origin
    const url = teamId 
      ? `${baseUrl}/play/station/${stationId}?team=${teamId}`
      : `${baseUrl}/play/station/${stationId}`
    return url
  }

  const generateExports = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const exports = []

      // Station QR Codes
      if (exportOptions.stationQRs) {
        const stationQRs = eventData.hunt_models.model_stations.map(station => ({
          stationId: station.station_id,
          displayName: station.display_name,
          qrData: generateQRCodeData(station.station_id),
          type: station.station_type,
          hint: station.location_hint
        }))
        exports.push({ type: 'station-qrs', data: stationQRs })
      }

      // Event Summary
      if (exportOptions.eventSummary) {
        const summary = {
          eventName: eventData.name,
          childName: eventData.child_name,
          date: eventData.date_start,
          status: eventData.status,
          huntModel: eventData.hunt_models.name,
          totalStations: eventData.hunt_models.model_stations.length,
          totalTeams: eventData.teams.length
        }
        exports.push({ type: 'event-summary', data: summary })
      }

      // Team List
      if (exportOptions.teamList) {
        const teams = eventData.teams.map(team => ({
          id: team.id,
          name: team.name,
          status: team.status,
          participants: team.participants || [],
          participantCount: (team.participants || []).length
        }))
        exports.push({ type: 'team-list', data: teams })
      }

      // Setup Guide
      if (exportOptions.setupGuide) {
        const setupGuide = {
          eventName: eventData.name,
          stations: eventData.hunt_models.model_stations,
          teams: eventData.teams,
          instructions: [
            'הדפיסו את כל קודי ה-QR לעמדות',
            'הציבו כל קוד בעמדה המתאימה לפי ההוראות',
            'ודאו שכל קוד נראה בבירור ולא פגום',
            'הכינו אביזרים נדרשים לכל עמדה',
            'בדקו קישוריות אינטרנט באזור',
            'הכינו גיבוי של קודי הצוותים'
          ]
        }
        exports.push({ type: 'setup-guide', data: setupGuide })
      }

      // Generate PDF via API
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventData.id,
          exports: exports,
          format: 'pdf'
        })
      })

      if (!response.ok) {
        throw new Error('שגיאה ביצירת הקובץ')
      }

      // Download the generated PDF
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventData.name.replace(/\s+/g, '_')}_export_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('הקובץ נוצר והורד בהצלחה!')

    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת הייצוא')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {/* Export Options */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>אפשרויות ייצוא</CardTitle>
          <CardDescription className="text-gray-400">
            בחרו מה לכלול בקובץ הייצוא
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Station QR Codes */}
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
            <Checkbox
              id="stationQRs"
              checked={exportOptions.stationQRs}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, stationQRs: checked as boolean }))
              }
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="stationQRs" className="flex items-center gap-2 font-medium text-white cursor-pointer">
                <QrCode className="w-5 h-5 text-spy-gold" />
                קודי QR לעמדות
              </label>
              <p className="text-sm text-gray-400 mt-1">
                דף לכל עמדה עם קוד QR להדפסה והצבה במקום
              </p>
              {exportOptions.stationQRs && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-300">עמדות שיוכללו:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {eventData.hunt_models.model_stations.map(station => (
                      <Badge key={station.station_id} variant="outline" className="border-spy-gold/30 text-spy-gold text-xs">
                        {station.station_id}: {station.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Event Summary */}
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
            <Checkbox
              id="eventSummary"
              checked={exportOptions.eventSummary}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, eventSummary: checked as boolean }))
              }
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="eventSummary" className="flex items-center gap-2 font-medium text-white cursor-pointer">
                <FileText className="w-5 h-5 text-spy-gold" />
                סיכום האירוע
              </label>
              <p className="text-sm text-gray-400 mt-1">
                עמוד סיכום עם פרטי האירוע, מודל הציד ונתונים כלליים
              </p>
            </div>
          </div>

          {/* Team List */}
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
            <Checkbox
              id="teamList"
              checked={exportOptions.teamList}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, teamList: checked as boolean }))
              }
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="teamList" className="flex items-center gap-2 font-medium text-white cursor-pointer">
                <Users className="w-5 h-5 text-spy-gold" />
                רשימת צוותים
              </label>
              <p className="text-sm text-gray-400 mt-1">
                טבלה עם כל הצוותים, משתתפים וקודי גישה
              </p>
              {exportOptions.teamList && (
                <div className="mt-3">
                  <p className="text-sm text-gray-300">
                    יוכללו {eventData.teams.length} צוותים עם סה״כ {eventData.teams.reduce((sum, team) => sum + (team.participants?.length || 0), 0)} משתתפים
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Setup Guide */}
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
            <Checkbox
              id="setupGuide"
              checked={exportOptions.setupGuide}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, setupGuide: checked as boolean }))
              }
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="setupGuide" className="flex items-center gap-2 font-medium text-white cursor-pointer">
                <Printer className="w-5 h-5 text-spy-gold" />
                מדריך הכנת האירוע
              </label>
              <p className="text-sm text-gray-400 mt-1">
                הוראות מפורטות להכנה ולהצבת קודי QR באירוע
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Card className="bg-red-500/20 border-red-500/30 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="bg-green-500/20 border-green-500/30 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">מוכן ליצור את הייצוא?</h3>
              <p className="text-sm text-gray-400">
                הקובץ יכלול את כל הפריטים שבחרתם וייווצר כ-PDF להדפסה
              </p>
            </div>
            
            <Button 
              onClick={generateExports}
              disabled={isGenerating || !Object.values(exportOptions).some(Boolean)}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-12 px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  יוצר קובץ...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  יצור והורד PDF
                </>
              )}
            </Button>
            
            {!Object.values(exportOptions).some(Boolean) && (
              <p className="text-sm text-yellow-400">
                אנא בחרו לפחות אפשרות אחת לייצוא
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}