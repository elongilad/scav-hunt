'use client'

import { useState, useEffect, use } from 'react'
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
  params: Promise<{
    id: string
  }>
}

export default function EventSetupPage({ params }: PageProps) {
  const { id } = use(params)
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

  useEffect(() => {
    checkEntitlement()
  }, [id])

  const checkEntitlement = async () => {
    try {
      const { data: entitlement } = await supabase
        .from('event_entitlements')
        .select('id, status')
        .eq('event_id', id)
        .eq('status', 'active')
        .single()

      if (!entitlement) {
        // No entitlement found - redirect to catalog
        router.push('/catalog')
        return
      }
    } catch (error) {
      console.error('Error checking entitlement:', error)
      router.push('/catalog')
    }
  }

  const loadEventAndStations = async () => {
    try {
      // Use our debug API endpoint to load data (which uses admin client)
      const response = await fetch(`/api/debug/event/${id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch event data: ${response.status}`)
      }

      const debugData = await response.json()

      console.log('🔍 API response:', debugData)

      if (!debugData.eventData) {
        console.error('❌ No event data in API response')
        throw new Error('Event not found')
      }

      setEvent(debugData.eventData)

      // Transform stations from the API response
      const transformedStations = debugData.stationsData?.map((station: any) => {
        const activity = station.default_activity || {};

        return {
          id: station.id,
          station_id: activity.station_id || station.id.split('_').pop() || station.id.replace(/[^0-9]/g, '') || '1',
          display_name: station.display_name || 'Quest Station',
          station_type: activity.station_type || station.type || 'activity',
          activity_description: activity.description || activity.instructions || 'Complete this quest activity',
          props_needed: activity.props_needed || []
        };
      }) || []

      console.log('🔍 Transformed stations:', transformedStations)
      setStations(transformedStations)

      // Initialize mappings
      const initialMappings: Record<string, StationMapping> = {}
      transformedStations?.forEach((station: any) => {
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
        .eq('event_id', id)

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
      const filePath = `events/${id}/stations/${stationId}/${fileName}`

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
          event_id: id,
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
        .eq('id', id)

      if (error) throw error

      router.push(`/dashboard/events/${id}`)
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
          <p className="text-gray-600">Loading event setup...</p>
        </div>
      </div>
    )
  }

  // Debug: Show if no stations are found
  if (stations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${id}`}>
            <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quest Setup</h1>
            <p className="text-gray-600">
              Set up real locations for {event?.child_name ? `${event.child_name}'s Quest` : 'the quest'}
            </p>
          </div>
        </div>

        <Card className="bg-white border-gray-200 text-gray-900">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Quest Stations Found</h2>
            <p className="text-gray-600 mb-4">
              This quest model doesn't have any stations configured yet. Stations define the activities and locations for your quest.
            </p>
            <p className="text-sm text-gray-500">
              Event ID: {id}<br/>
              Model ID: {event?.model_id || 'Not loaded'}<br/>
              Quest: {event?.hunt_models?.name || event?.child_name || 'Not loaded'}<br/>
              Event Status: {event?.status || 'Unknown'}<br/>
              Stations Array Length: {stations?.length || 0}
            </p>

            {event && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-blue-600">Debug: Raw Event Data</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${id}`}>
          <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quest Setup</h1>
          <p className="text-gray-600">
            Set up real locations for {event?.child_name ? `${event.child_name}'s Quest` : 'the quest'}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-white border-gray-200 text-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-spy-gold" />
            Station Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-900">Overall Progress</span>
              <span className="text-spy-gold font-semibold">{getSetupProgress()}%</span>
            </div>
            <Progress value={getSetupProgress()} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-spy-gold font-semibold">{stations.length}</p>
                <p className="text-gray-600">Total Stations</p>
              </div>
              <div className="text-center">
                <p className="text-spy-gold font-semibold">
                  {Object.values(mappings).filter(m => m.real_location).length}
                </p>
                <p className="text-gray-600">Locations Set</p>
              </div>
              <div className="text-center">
                <p className="text-spy-gold font-semibold">
                  {Object.values(mappings).filter(m => m.qr_generated).length}
                </p>
                <p className="text-gray-600">QR codes</p>
              </div>
              <div className="text-center">
                <p className="text-spy-gold font-semibold">
                  {Object.values(mappings).filter(m => m.media_uploaded).length}
                </p>
                <p className="text-gray-600">With Photos</p>
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
            <Card key={station.id} className="bg-white border-gray-200 text-gray-900">
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
                        <h3 className="text-lg font-semibold">Station {station.station_id}: {station.display_name}</h3>
                        <p className="text-sm text-gray-600">{station.station_type}</p>
                      </div>
                    </CardTitle>
                  </div>
                  
                  <Badge variant={isComplete ? "default" : "secondary"} 
                         className={isComplete ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                    {isComplete ? 'Ready' : 'Needs Setup'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Activity Description:</p>
                  <p className="text-gray-900">{station.activity_description}</p>
                  
                  {station.props_needed && station.props_needed.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Required Props:</p>
                      <ul className="text-sm text-gray-600">
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
                      <Label className="text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-spy-gold" />
                        Real Location
                      </Label>
                      <Input
                        value={mapping.real_location || ''}
                        onChange={(e) => updateMapping(station.station_id, { real_location: e.target.value })}
                        placeholder="e.g. In the backyard, next to the big tree..."
                        className="bg-white border-gray-200 text-gray-900 placeholder-gray-600"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-900">Setup Instructions</Label>
                      <Textarea
                        value={mapping.setup_notes || ''}
                        onChange={(e) => updateMapping(station.station_id, { setup_notes: e.target.value })}
                        placeholder="Special instructions for setting up this station..."
                        className="bg-white border-gray-200 text-gray-900 placeholder-gray-600"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-900">Custom Clue (Optional)</Label>
                      <Input
                        value={mapping.custom_clue || ''}
                        onChange={(e) => updateMapping(station.station_id, { custom_clue: e.target.value })}
                        placeholder="Custom clue for this specific location..."
                        className="bg-white border-gray-200 text-gray-900 placeholder-gray-600"
                      />
                    </div>
                  </div>

                  {/* Media & QR */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-900 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-spy-gold" />
                        Location Photos
                      </Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
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
                          <p className="text-gray-600 text-sm">Click to upload photos</p>
                        </label>
                        
                        {mapping.photos && mapping.photos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-green-400 text-sm">
                              {mapping.photos.length} photos selected
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
                            QR Code Ready
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4 mr-2" />
                            Generate QR Code
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => saveStationMapping(station.station_id)}
                        disabled={!mapping.real_location}
                        variant="outline"
                        className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
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
      <Card className="bg-white border-gray-200 text-gray-900">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Event Setup</h3>
              <p className="text-gray-600">
                After setting up all stations, the quest will be ready to run
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
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
          
          {getSetupProgress() < 100 && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 text-sm">
                  Please complete location and QR code setup for all stations before finishing setup
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}