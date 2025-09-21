'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Video,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Play,
  AlertCircle
} from 'lucide-react'

interface RenderJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  output_path?: string
  error_message?: string
  created_at: string
  updated_at: string
}

interface VideoRenderStatusProps {
  jobId?: string
  eventId?: string
  onComplete?: (outputPath: string) => void
  className?: string
}

export default function VideoRenderStatus({ 
  jobId, 
  eventId, 
  onComplete, 
  className 
}: VideoRenderStatusProps) {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (jobId || eventId) {
      fetchStatus()
      
      // Poll for updates every 3 seconds for active jobs
      const interval = setInterval(() => {
        const hasActiveJobs = jobs.some(job => 
          job.status === 'pending' || job.status === 'processing'
        )
        if (hasActiveJobs) {
          fetchStatus()
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [jobId, eventId]) // fetchStatus and jobs are handled separately

  const fetchStatus = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (jobId) params.set('jobId', jobId)
      if (eventId) params.set('eventId', eventId)

      const response = await fetch(`/api/render?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status')
      }

      if (jobId) {
        setJobs([data.job])
        
        // Call onComplete callback if job is completed
        if (data.job.status === 'completed' && data.job.output_path && onComplete) {
          onComplete(data.job.output_path)
        }
      } else {
        setJobs(data.jobs || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [jobId, eventId])

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/render?jobId=${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel job')
      }

      // Refresh status
      fetchStatus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const downloadVideo = async (outputPath: string, jobId: string) => {
    try {
      // In a real implementation, this would create a signed URL for download
      const link = document.createElement('a')
      link.href = `/api/download?path=${encodeURIComponent(outputPath)}`
      link.download = `hunt_video_${jobId}.mp4`
      link.click()
    } catch (err: unknown) {
      setError('Failed to download video')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'processing': return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין בתור'
      case 'processing': return 'מעבד...'
      case 'completed': return 'הושלם'
      case 'failed': return 'נכשל'
      default: return status
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-spy-gold animate-spin" />
            <span>טוען סטטוס עיבוד...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchStatus}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">אין משימות עיבוד</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {jobs.map((job) => (
        <Card key={job.id} className="bg-white/10 border-white/20 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getStatusIcon(job.status)}
                עיבוד וידאו
              </CardTitle>
              
              <Badge variant="outline" className={getStatusColor(job.status)}>
                {getStatusText(job.status)}
              </Badge>
            </div>
            <CardDescription className="text-gray-400">
              ID: {job.id.substring(0, 8)}... • 
              נוצר: {new Date(job.created_at).toLocaleString('he-IL')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            {job.status === 'processing' && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">התקדמות</span>
                  <span className="text-blue-400">{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-3" />
                <p className="text-xs text-gray-400 mt-1">
                  זמן עיבוד: {formatDuration(job.created_at, job.updated_at)}
                </p>
              </div>
            )}

            {/* Completed Status */}
            {job.status === 'completed' && job.output_path && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium text-green-400">הוידאו מוכן!</p>
                    <p className="text-sm text-gray-300">
                      העיבוד הושלם בהצלחה בתוך {formatDuration(job.created_at, job.updated_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => downloadVideo(job.output_path!, job.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    הורד וידאו
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    צפה
                  </Button>
                </div>
              </div>
            )}

            {/* Error Status */}
            {job.status === 'failed' && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <p className="font-medium text-red-400">העיבוד נכשל</p>
                </div>
                
                {job.error_message && (
                  <p className="text-sm text-gray-300 mb-3">{job.error_message}</p>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  נסה שוב
                </Button>
              </div>
            )}

            {/* Pending Status */}
            {job.status === 'pending' && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-yellow-400">ממתין בתור</p>
                      <p className="text-sm text-gray-300">
                        המשימה תתחיל בקרוב
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => cancelJob(job.id)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}

            {/* Processing Status */}
            {job.status === 'processing' && (
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-400">עיבוד בתהליך</p>
                    <p className="text-sm text-gray-300">
                      שילוב קטעי הוידאו עם התבנית
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <p className="text-xs text-gray-400">
                עודכן לאחרונה: {new Date(job.updated_at).toLocaleString('he-IL')}
              </p>
              
              <Button 
                size="sm" 
                variant="ghost"
                onClick={fetchStatus}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}