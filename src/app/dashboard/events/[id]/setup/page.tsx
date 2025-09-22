'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Save, 
  MapPin,
  Upload,
  Camera,
  QrCode,
  CheckCircle,
  AlertCircle,
  Image,
  Video,
  FileText,
  Map,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface Station {
  id: string
  station_id: string
  display_name: string
  station_type: string
  activity_description: string
  props_needed: string[]
}

interface StationMapping {
  station_id: string
  real_location: string
  coordinates?: { lat: number; lng: number }
  setup_notes: string
  qr_generated: boolean
  media_uploaded: boolean
  photos: File[]
  custom_clue?: string
}

interface PageProps {
  params: {
    id: string
  }
}

export default function EventSetupPage({ params }: PageProps) {
  const [event, setEvent] = useState<any>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [mappings, setMappings] = useState<Record<string, StationMapping>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadEventAndStations()
  }, [])

  const loadEventAndStations = async () => {
    try {
      // Load event details
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          id,
          child_name,
          model_id,
          status,
          location,
          hunt_models (name)
        `)
        .eq('id', params.id)
        .single()

      if (!eventData) throw new Error('Event not found')
      setEvent(eventData)

      // Load model stations
      const { data: stationsData } = await supabase
        .from('model_stations')
        .select('*')
        .eq('model_id', eventData.model_id)
        .order('station_id')

      setStations(stationsData || [])

      // Initialize mappings
      const initialMappings: Record<string, StationMapping> = {}
      stationsData?.forEach(station => {
        initialMappings[station.station_id] = {
          station_id: station.station_id,
          real_location: '',
          setup_notes: '',
          qr_generated: false,
          media_uploaded: false,
          photos: []
        }
      })
      setMappings(initialMappings)

      // Load existing mappings if any
      const { data: existingMappings } = await supabase
        .from('event_station_mappings')
        .select('*')
        .eq('event_id', params.id)

      existingMappings?.forEach(mapping => {
        if (initialMappings[mapping.station_id]) {
          initialMappings[mapping.station_id] = {
            ...initialMappings[mapping.station_id],
            real_location: mapping.real_location || '',
            coordinates: mapping.coordinates,
            setup_notes: mapping.setup_notes || '',
            qr_generated: mapping.qr_generated || false,
            media_uploaded: mapping.photos?.length > 0 || false,
            custom_clue: mapping.custom_clue
          }
        }
      })
      setMappings(initialMappings)

    } catch (error) {
      console.error('Error loading event data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMapping = (stationId: string, updates: Partial<StationMapping>) => {
    setMappings(prev => ({
      ...prev,
      [stationId]: { ...prev[stationId], ...updates }
    }))
  }

  const handlePhotoUpload = async (stationId: string, files: FileList) => {
    if (!files.length) return

    const photos = Array.from(files)
    updateMapping(stationId, { photos })

    // Upload photos to Supabase Storage
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${i}.${fileExt}`
      const filePath = `events/${params.id}/stations/${stationId}/${fileName}`

      try {
        setUploadProgress(prev => ({ ...prev, [`${stationId}-${i}`]: 0 }))

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        setUploadProgress(prev => ({ ...prev, [`${stationId}-${i}`]: 100 }))
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    updateMapping(stationId, { media_uploaded: true })
  }

  const generateQRCode = async (stationId: string) => {
    try {
      // This would integrate with a QR generation service
      // For now, we'll just mark it as generated
      updateMapping(stationId, { qr_generated: true })
      
      // In real implementation, this would:
      // 1. Generate QR code with station URL
      // 2. Save QR image to storage
      // 3. Make it available for download
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const saveStationMapping = async (stationId: string) => {
    const mapping = mappings[stationId]
    if (!mapping) return

    try {
      const { error } = await supabase
        .from('event_station_mappings')
        .upsert({
          event_id: params.id,
          station_id: stationId,
          real_location: mapping.real_location,
          coordinates: mapping.coordinates,
          setup_notes: mapping.setup_notes,
          qr_generated: mapping.qr_generated,
          custom_clue: mapping.custom_clue,
          photos: mapping.photos.map(f => f.name) // Store file names
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving mapping:', error)
    }
  }

  const completeSetup = async () => {
    setSaving(true)
    try {
      // Save all mappings
      for (const stationId of Object.keys(mappings)) {
        await saveStationMapping(stationId)
      }

      // Update event status to ready
      const { error } = await supabase
        .from('events')
        .update({ status: 'ready' })
        .eq('id', params.id)

      if (error) throw error

      router.push(`/dashboard/events/${params.id}`)
    } catch (error) {
      console.error('Error completing setup:', error)
    } finally {
      setSaving(false)
    }
  }

  const getSetupProgress = () => {
    const totalStations = stations.length
    if (totalStations === 0) return 0

    let completedStations = 0
    Object.values(mappings).forEach(mapping => {
      if (mapping.real_location && mapping.qr_generated) {
        completedStations++
      }
    })

    return Math.round((completedStations / totalStations) * 100)
  }

  const isStationComplete = (stationId: string) => {
    const mapping = mappings[stationId]
    return mapping?.real_location && mapping?.qr_generated
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">טוען הגדרות אירוע...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${params.id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">הגדרת עמדות</h1>
          <p className="text-gray-300">
            הגדר מיקומים ממשיים עבור {event?.child_name ? `ציד של ${event.child_name}` : 'האירוע'}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-spy-gold" />
            התקדמות הגדרת עמדות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white">התקדמות כללית</span>
              <span className="text-spy-gold font-semibold">{getSetupProgress()}%</span>
            </div>
            <Progress value={getSetupProgress()} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-spy-gold font-semibold">{stations.length}</p>
                <p className="text-gray-400">סה"כ עמדות</p>
              </div>
              <div className="text-center">
                <p className="text-spy-gold font-semibold">
                  {Object.values(mappings).filter(m => m.real_location).length}
                </p>
                <p className="text-gray-400">מיקומים מוגדרים</p>
              </div>
              <div className="text-center">
                <p className="text-spy-gold font-semibold">
                  {Object.values(mappings).filter(m => m.qr_generated).length}
                </p>
                <p className="text-gray-400">QR codes</p>
              </div>
              <div className="text-center">
                <p className="text-spy-gold font-semibold">
                  {Object.values(mappings).filter(m => m.media_uploaded).length}
                </p>
                <p className="text-gray-400">עם תמונות</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stations Setup */}
      <div className="space-y-6">
        {stations.map((station, index) => {
          const mapping = mappings[station.station_id] || {}
          const isComplete = isStationComplete(station.station_id)
          
          return (
            <Card key={station.id} className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isComplete ? 'bg-green-500' : 'bg-spy-gold/30'
                      }`}>
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-spy-gold">{station.station_id}</span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold">עמדה {station.station_id}: {station.display_name}</h3>
                        <p className="text-sm text-gray-400">{station.station_type}</p>
                      </div>
                    </CardTitle>
                  </div>
                  
                  <Badge variant={isComplete ? "default" : "secondary"} 
                         className={isComplete ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                    {isComplete ? 'מוכן' : 'דרוש הגדרה'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">תיאור הפעילות:</p>
                  <p className="text-white">{station.activity_description}</p>
                  
                  {station.props_needed && station.props_needed.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-300 mb-1">אביזרים נדרשים:</p>
                      <ul className="text-sm text-gray-400">
                        {station.props_needed.map((prop, idx) => (
                          <li key={idx}>• {prop}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Location Mapping */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-spy-gold" />
                        מיקום בפועל
                      </Label>
                      <Input
                        value={mapping.real_location || ''}
                        onChange={(e) => updateMapping(station.station_id, { real_location: e.target.value })}
                        placeholder="למשל: בחצר האחורית, ליד העץ הגדול..."
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <Label className="text-white">הוראות הגדרה</Label>
                      <Textarea
                        value={mapping.setup_notes || ''}
                        onChange={(e) => updateMapping(station.station_id, { setup_notes: e.target.value })}
                        placeholder="הוראות מיוחדות להגדרת העמדה..."
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-white">רמז מותאם (אופציונלי)</Label>
                      <Input
                        value={mapping.custom_clue || ''}
                        onChange={(e) => updateMapping(station.station_id, { custom_clue: e.target.value })}
                        placeholder="רמז מותאם למיקום הספציפי..."
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Media & QR */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-spy-gold" />
                        תמונות המיקום
                      </Label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => e.target.files && handlePhotoUpload(station.station_id, e.target.files)}
                          className="hidden"
                          id={`photos-${station.station_id}`}
                        />
                        <label htmlFor={`photos-${station.station_id}`} className="cursor-pointer">
                          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                          <p className="text-gray-400 text-sm">לחץ להעלאת תמונות</p>
                        </label>
                        
                        {mapping.photos && mapping.photos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-green-400 text-sm">
                              {mapping.photos.length} תמונות נבחרו
                            </p>
                            {Object.entries(uploadProgress)
                              .filter(([key]) => key.startsWith(station.station_id))
                              .map(([key, progress]) => (
                                <div key={key} className="mt-1">
                                  <Progress value={progress} className="h-1" />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => generateQRCode(station.station_id)}
                        disabled={!mapping.real_location || mapping.qr_generated}
                        className={`w-full ${
                          mapping.qr_generated 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-spy-gold hover:bg-spy-gold/90 text-black'
                        }`}
                      >
                        {mapping.qr_generated ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            QR Code מוכן
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4 mr-2" />
                            צור QR Code
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => saveStationMapping(station.station_id)}
                        disabled={!mapping.real_location}
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        שמור הגדרות
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Complete Setup */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">סיום הגדרת האירוע</h3>
              <p className="text-gray-300">
                לאחר השלמת הגדרת כל העמדות, האירוע יהיה מוכן להפעלה
              </p>
            </div>
            
            <Button
              onClick={completeSetup}
              disabled={getSetupProgress() < 100 || saving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  שומר...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  סיים הגדרה
                </>
              )}
            </Button>
          </div>
          
          {getSetupProgress() < 100 && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 text-sm">
                  יש להשלים הגדרת מיקום ו-QR code לכל העמדות לפני סיום ההגדרה
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}