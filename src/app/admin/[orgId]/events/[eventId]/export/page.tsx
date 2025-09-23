'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download,
  QrCode,
  FileText,
  Printer,
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Users,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  name: string
  child_name: string
  status: string
  event_date: string
  teams: Team[]
  hunt_models: {
    name: string
    model_stations: Station[]
  }
}

interface Team {
  id: string
  name: string
  status: string
  participants: string[]
}

interface Station {
  station_id: string
  display_name: string
  station_type: string
  location_hint?: string
}

interface PageProps {
  params: Promise<{
    orgId: string
    eventId: string
  }>
}

export default function EventExportPage({ params }: PageProps) {
  const { orgId, eventId } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportOptions, setExportOptions] = useState({
    stationQRs: true,
    eventSummary: true,
    teamList: true,
    setupGuide: true
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadEventData()
  }, [eventId])

  const loadEventData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          child_name,
          status,
          event_date,
          teams (
            id,
            name,
            status,
            participants
          ),
          hunt_models (
            name,
            model_stations (
              station_id,
              display_name,
              station_type,
              location_hint
            )
          )
        `)
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError

      setEvent(eventData as any)
    } catch (err: any) {
      setError('שגיאה בטעינת נתוני האירוע')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCodeData = (stationId: string, teamId?: string) => {
    const baseUrl = window.location.origin
    const url = teamId 
      ? `${baseUrl}/play/station/${stationId}?team=${teamId}`
      : `${baseUrl}/play/station/${stationId}`
    return url
  }

  const generateExports = async () => {
    if (!event) return

    setIsGenerating(true)
    setError(null)

    try {
      const exports = []

      // Station QR Codes
      if (exportOptions.stationQRs) {
        const stationQRs = event.hunt_models.model_stations.map(station => ({
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
          eventName: event.name,
          childName: event.child_name,
          date: event.event_date,
          status: event.status,
          huntModel: event.hunt_models.name,
          totalStations: event.hunt_models.model_stations.length,
          totalTeams: event.teams.length
        }
        exports.push({ type: 'event-summary', data: summary })
      }

      // Team List
      if (exportOptions.teamList) {
        const teams = event.teams.map(team => ({
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
          eventName: event.name,
          stations: event.hunt_models.model_stations,
          teams: event.teams,
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
          eventId: event.id,
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
      a.download = `${event.name.replace(/\s+/g, '_')}_export_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת הייצוא')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-spy-gold animate-spin mx-auto mb-4" />
              <p className="text-gray-300">טוען נתוני אירוע...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error || 'אירוע לא נמצא'}</p>
              <Link href={`/admin/${orgId}/events`}>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  חזור לאירועים
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Link href={`/admin/${orgId}/events/${eventId}`}>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-6 h-6 text-spy-gold" />
                  ייצוא אירוע
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {event.child_name ? `ציד של ${event.child_name}` : event.name}
                </CardDescription>
              </div>

              <Badge 
                variant="outline"
                className={
                  event.status === 'active' ? 'border-green-500/30 text-green-400' :
                  event.status === 'completed' ? 'border-blue-500/30 text-blue-400' :
                  'border-gray-500/30 text-gray-400'
                }
              >
                {event.status === 'active' ? 'פעיל' :
                 event.status === 'completed' ? 'הושלם' :
                 event.status === 'draft' ? 'טיוטה' : 'לא פעיל'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Event Overview */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>פרטי האירוע</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Calendar className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="font-bold text-white">{new Date(event.event_date).toLocaleDateString('he-IL')}</p>
                <p className="text-sm text-gray-400">תאריך</p>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <MapPin className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="font-bold text-white">{event.hunt_models.model_stations.length}</p>
                <p className="text-sm text-gray-400">עמדות</p>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Users className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="font-bold text-white">{event.teams.length}</p>
                <p className="text-sm text-gray-400">צוותים</p>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Package className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="font-bold text-white">{event.hunt_models.name}</p>
                <p className="text-sm text-gray-400">מודל ציד</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      {event.hunt_models.model_stations.map(station => (
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
                      יוכללו {event.teams.length} צוותים עם סה״כ {event.teams.reduce((sum, team) => sum + (team.participants?.length || 0), 0)} משתתפים
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

        {/* Error Display */}
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

        {/* Instructions */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-lg">הוראות שימוש</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">בחרו אפשרויות ייצוא</p>
                  <p className="text-gray-400 text-xs">סמנו את הפריטים שברצונכם לכלול בקובץ</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">יצרו את הקובץ</p>
                  <p className="text-gray-400 text-xs">לחצו על "יצור והורד PDF" וחכו לסיום</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">הדפיסו והכינו</p>
                  <p className="text-gray-400 text-xs">הדפיסו את הקובץ והציבו קודי QR לפי ההוראות</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}