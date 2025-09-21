'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  MapPin,
  Camera,
  Upload,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Video,
  FileText,
  Navigation,
  Trophy
} from 'lucide-react'
import Link from 'next/link'

interface Station {
  station_id: string
  display_name: string
  station_type: string
  activity_description: string
  props_needed: string[]
  estimated_duration: number
}

interface Mission {
  id: string
  title?: string
  clue: any
  video_template_id?: string
  overlay_spec?: any
  locale: string
}

interface PageProps {
  params: {
    teamId: string
    stationId: string
  }
}

export default function StationPage({ params }: PageProps) {
  const [station, setStation] = useState<Station | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadStationData()
    return () => {
      stopRecording()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [params.stationId])

  const loadStationData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get team's event and model
      const { data: team } = await supabase
        .from('teams')
        .select(`
          event_id,
          events (
            model_id
          )
        `)
        .eq('id', params.teamId)
        .single()

      if (!team) throw new Error('צוות לא נמצא')

      const modelId = (team as any).events.model_id

      // Get station data
      const { data: stationData } = await supabase
        .from('model_stations')
        .select('*')
        .eq('model_id', modelId)
        .eq('station_id', params.stationId)
        .single()

      if (!stationData) throw new Error('עמדה לא נמצאה')

      setStation(stationData)

      // Get mission for this station
      const { data: missionData } = await supabase
        .from('model_missions')
        .select('*')
        .eq('model_id', modelId)
        .eq('to_station_id', params.stationId)
        .eq('active', true)
        .single()

      setMission(missionData || null)

      // Mark station as started
      await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-station',
          teamId: params.teamId,
          stationId: params.stationId
        })
      })

    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתוני העמדה')
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      setError(null)
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err: any) {
      setError('לא ניתן לגשת למצלמה. אנא ודאו שנתתם הרשאות.')
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera()
      if (!streamRef.current) return
    }

    try {
      chunksRef.current = []
      setRecordingTime(0)
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedVideo(blob)
        
        // Create preview URL
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = URL.createObjectURL(blob)
          videoRef.current.controls = true
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err: any) {
      setError('שגיאה בתחילת ההקלטה')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const retakeVideo = () => {
    setRecordedVideo(null)
    setRecordingTime(0)
    if (videoRef.current) {
      videoRef.current.controls = false
      videoRef.current.src = ''
    }
    startCamera()
  }

  const uploadVideo = async () => {
    if (!recordedVideo) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${params.teamId}_${params.stationId}_${timestamp}.webm`
      const filePath = `teams/${params.teamId}/clips/${filename}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, recordedVideo, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(percent)
          }
        })

      if (uploadError) throw uploadError

      // Complete the station
      const response = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-station',
          teamId: params.teamId,
          stationId: params.stationId,
          scoreEarned: 100, // Base score - could be dynamic
          userClips: [filePath],
          notes: notes.trim() || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'שגיאה בהשלמת העמדה')
      }

      setSuccess('המשימה הושלמה בהצלחה!')

      // Navigate to next station or completion
      setTimeout(() => {
        if (result.nextStation?.next_station_id) {
          router.push(`/play/${params.teamId}/station/${result.nextStation.next_station_id}`)
        } else if (result.nextStation?.completion_status === 'completed') {
          router.push(`/play/${params.teamId}/completed`)
        } else {
          router.push(`/play/${params.teamId}`)
        }
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'שגיאה בהעלאת הוידאו')
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">טוען נתוני עמדה...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !station) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Link href={`/play/${params.teamId}`}>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  חזור
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Link href={`/play/${params.teamId}`}>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-spy-gold" />
                  עמדה {station?.station_id}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {station?.display_name}
                </CardDescription>
              </div>
              
              <Badge variant="outline" className="border-white/20 text-gray-300">
                {station?.station_type}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Success Message */}
        {success && (
          <Card className="bg-green-500/20 border-green-500/30 text-white">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 font-medium">{success}</p>
              <p className="text-gray-300 text-sm mt-2">מעביר לעמדה הבאה...</p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
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

        {/* Mission Details */}
        {mission && (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-spy-gold" />
                המשימה שלכם
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mission.title && (
                <h3 className="font-medium text-white">{mission.title}</h3>
              )}
              
              {mission.clue && typeof mission.clue === 'object' && mission.clue.text && (
                <div className="p-4 bg-spy-gold/20 border border-spy-gold/30 rounded-lg">
                  <p className="text-white">{mission.clue.text}</p>
                </div>
              )}
              
              {mission.video_template_id && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Video className="w-4 h-4" />
                  <span>המשימה כוללת וידאו מותאם אישית</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Station Info */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-spy-gold" />
              פרטי העמדה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">{station?.activity_description}</p>
            
            {station?.props_needed && station.props_needed.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">אביזרים נדרשים:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {station.props_needed.map((prop, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-spy-gold rounded-full" />
                      {prop}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-spy-gold" />
                <span className="text-gray-300">זמן צפוי: {station?.estimated_duration} דק׳</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-spy-gold" />
                <span className="text-gray-300">100 נקודות</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Recording */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-spy-gold" />
              תיעוד המשימה
            </CardTitle>
            <CardDescription className="text-gray-400">
              צלמו וידאו קצר של ביצוע המשימה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Display */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted={!recordedVideo}
              />
              
              {/* Recording Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    REC {formatTime(recordingTime)}
                  </span>
                </div>
              )}
              
              {isPaused && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Pause className="w-12 h-12 text-white mx-auto mb-2" />
                    <p className="text-white">הקלטה מושהית</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            {!recordedVideo && (
              <div className="space-y-3">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    התחל הקלטה
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {!isPaused ? (
                      <Button 
                        onClick={pauseRecording}
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        השהה
                      </Button>
                    ) : (
                      <Button 
                        onClick={resumeRecording}
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        המשך
                      </Button>
                    )}
                    
                    <Button 
                      onClick={stopRecording}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      עצור
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Video Actions */}
            {recordedVideo && !isUploading && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={retakeVideo}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    צלם שוב
                  </Button>
                  
                  <Button 
                    onClick={uploadVideo}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    סיים משימה
                  </Button>
                </div>
                
                {/* Notes */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">הערות נוספות (אופציונלי)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הוסיפו הערות על ביצוע המשימה..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">מעלה וידאו...</span>
                  <span className="text-white">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-center text-sm text-gray-400">
                  אנא המתינו עד לסיום ההעלאה
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        {!recordedVideo && (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-lg">מה הלאה?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">בצעו את המשימה</p>
                    <p className="text-gray-400 text-xs">עקבו אחר ההוראות והשתמשו באביזרים</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">צלמו וידאו</p>
                    <p className="text-gray-400 text-xs">תעדו את ביצוע המשימה (15-30 שניות)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">סיימו והמשיכו</p>
                    <p className="text-gray-400 text-xs">תקבלו רמז לעמדה הבאה</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}