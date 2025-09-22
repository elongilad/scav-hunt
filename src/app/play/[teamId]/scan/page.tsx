'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Camera,
  ArrowLeft,
  QrCode,
  Flashlight,
  RotateCcw,
  Type,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    teamId: string
  }
}

export default function QRScannerPage({ params }: PageProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanForQR, 500)
      }
    } catch (err: any) {
      setError('לא ניתן לגשת למצלמה. אנא ודאו שנתתם הרשאות.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  const scanForQR = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.videoWidth === 0) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // In a real implementation, you would use a QR code scanning library here
      // For now, we'll simulate QR detection
      
      // This is where you'd integrate with libraries like:
      // - jsQR
      // - qr-scanner
      // - @zxing/library
      
      // Simulated QR detection for demo purposes
      // In production, replace this with actual QR scanning logic
      
    } catch (err) {
      // QR scanning errors are normal and expected
    }
  }

  const toggleFlashlight = async () => {
    if (!streamRef.current) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      if ((capabilities as any).torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashlightOn } as any]
        })
        setFlashlightOn(!flashlightOn)
      }
    } catch (err) {
      console.log('Flashlight not supported')
    }
  }

  const switchCamera = () => {
    stopScanning()
    setFacingMode(facingMode === 'user' ? 'environment' : 'user')
    setTimeout(startScanning, 100)
  }

  const processQRCode = async (qrData: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Extract station ID from QR code
      // QR codes should contain URLs like: https://yourapp.com/play/station/STATION_ID?team=TEAM_ID
      const url = new URL(qrData)
      const pathParts = url.pathname.split('/')
      const stationId = pathParts[pathParts.length - 1]

      if (!stationId) {
        throw new Error('קוד QR לא תקין')
      }

      // Validate that this is a station QR code for this team
      const teamParam = url.searchParams.get('team')
      if (teamParam && teamParam !== params.teamId) {
        throw new Error('קוד QR זה מיועד לצוות אחר')
      }

      // Navigate to station
      stopScanning()
      setSuccess(`נמצאה עמדה: ${stationId}`)
      
      setTimeout(() => {
        router.push(`/play/${params.teamId}/station/${stationId}`)
      }, 1000)

    } catch (err: any) {
      setError(err.message || 'שגיאה בעיבוד קוד QR')
    } finally {
      setIsProcessing(false)
    }
  }

  const processManualCode = async () => {
    if (!manualCode.trim()) {
      setError('אנא הזינו קוד עמדה')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Navigate directly to station with manual code
      const stationId = manualCode.trim().toUpperCase()
      setSuccess(`מעביר לעמדה: ${stationId}`)
      
      setTimeout(() => {
        router.push(`/play/${params.teamId}/station/${stationId}`)
      }, 1000)

    } catch (err: any) {
      setError('קוד עמדה לא תקין')
    } finally {
      setIsProcessing(false)
    }
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
              
              <div>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-spy-gold" />
                  סריקת QR Code
                </CardTitle>
                <CardDescription className="text-gray-400">
                  סרקו את הקוד בעמדה או הזינו ידנית
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Success Message */}
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

        {/* Camera Scanner */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-lg">סורק מצלמה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">הפעילו את המצלמה לסריקת QR</p>
                <Button 
                  onClick={startScanning}
                  className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  פתח מצלמה
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Feed */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    playsInline
                    muted
                  />
                  
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-spy-gold rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-spy-gold"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-spy-gold"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-spy-gold"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-spy-gold"></div>
                      
                      {isProcessing && (
                        <div className="absolute inset-0 bg-spy-gold/20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-spy-gold text-sm">מעבד...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hidden canvas for QR processing */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Camera Controls */}
                <div className="flex justify-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFlashlight}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Flashlight className={`w-4 h-4 ${flashlightOn ? 'text-yellow-400' : ''}`} />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={switchCamera}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopScanning}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-400">
                  כוונו את המצלמה לקוד QR של העמדה
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Code Entry */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-spy-gold" />
              הזנה ידנית
            </CardTitle>
            <CardDescription className="text-gray-400">
              אם הסריקה לא עובדת, הזינו את קוד העמדה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualCode" className="text-white">קוד עמדה</Label>
              <Input
                id="manualCode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="למשל: ST001"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-center font-mono text-lg"
                onKeyDown={(e) => e.key === 'Enter' && processManualCode()}
              />
            </div>

            <Button 
              onClick={processManualCode}
              disabled={isProcessing || !manualCode.trim()}
              className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  מעבד...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  עבור לעמדה
                </>
              )}
            </Button>
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
                  <p className="text-white text-sm font-medium">הפעילו את המצלמה</p>
                  <p className="text-gray-400 text-xs">לחצו על "פתח מצלמה" ואשרו הרשאות</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">כוונו למרכז הריבוע</p>
                  <p className="text-gray-400 text-xs">הציבו את קוד QR במרכז הריבוע הזהוב</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">המתינו לזיהוי</p>
                  <p className="text-gray-400 text-xs">הסריקה תתבצע אוטומטית</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <p className="text-center text-sm text-gray-400 mb-2">
              בעיות בסריקה?
            </p>
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">• ודאו שהתמונה חדה ומוארת</p>
              <p className="text-xs text-gray-500">• נסו להדליק את הפנס</p>
              <p className="text-xs text-gray-500">• השתמשו בהזנה ידנית</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}