'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Upload, 
  Video,
  File,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface UploadState {
  file: File | null
  uploading: boolean
  progress: number
  uploaded: boolean
  error: string
}

export default function UploadVideoPage() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    uploaded: false,
    error: ''
  })
  
  const [language, setLanguage] = useState<'he' | 'en'>('he')
  const [metadata, setMetadata] = useState({
    title: '',
    description: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadState(prev => ({ ...prev, error: 'יש לבחור קובץ וידאו בלבד' }))
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadState(prev => ({ ...prev, error: 'קובץ הוידאו גדול מדי (מקסימום 500MB)' }))
      return
    }

    setUploadState(prev => ({ 
      ...prev, 
      file, 
      error: '',
      uploaded: false 
    }))

    // Auto-set title from filename
    if (!metadata.title) {
      const title = file.name.replace(/\.[^/.]+$/, '')
      setMetadata(prev => ({ ...prev, title }))
    }
  }

  const handleUpload = async () => {
    if (!uploadState.file) return

    setUploadState(prev => ({ ...prev, uploading: true, progress: 0, error: '' }))

    try {
      // Get current user and org
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('משתמש לא מחובר')

      const { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)

      if (!orgs || orgs.length === 0) {
        throw new Error('לא נמצא ארגון')
      }

      const orgId = orgs[0].org_id

      // Generate unique filename
      const fileExt = uploadState.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${orgId}/videos/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, uploadState.file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadState(prev => ({ ...prev, progress: percent }))
          }
        })

      if (uploadError) throw uploadError

      // Extract video metadata (duration, resolution, etc.)
      const videoElement = document.createElement('video')
      const videoMetadata = await new Promise<any>((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          resolve({
            duration: Math.round(videoElement.duration),
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
            resolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`
          })
        }
        videoElement.onerror = reject
        videoElement.src = URL.createObjectURL(uploadState.file!)
      })

      // Create media asset record
      const { data: asset, error: assetError } = await supabase
        .from('media_assets')
        .insert({
          org_id: orgId,
          kind: 'video',
          storage_path: filePath,
          provider: 'supabase',
          duration_seconds: videoMetadata.duration,
          language: language,
          meta: {
            ...videoMetadata,
            title: metadata.title,
            description: metadata.description,
            originalName: uploadState.file.name,
            fileSize: uploadState.file.size,
            mimeType: uploadState.file.type
          }
        })
        .select()
        .single()

      if (assetError) throw assetError

      setUploadState(prev => ({ ...prev, uploaded: true, uploading: false }))

      // Redirect to timeline editor after a short delay
      setTimeout(() => {
        router.push(`/admin/templates/${asset.id}/timeline`)
      }, 2000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: error.message || 'שגיאה בהעלאת הקובץ' 
      }))
    }
  }

  const resetUpload = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      uploaded: false,
      error: ''
    })
    setMetadata({ title: '', description: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/templates">
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">העלאת וידאו</h1>
          <p className="text-gray-300">העלה קובץ וידאו חדש ליצירת תבנית</p>
        </div>
      </div>

      {!uploadState.uploaded ? (
        <div className="space-y-6">
          {/* File Upload */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-spy-gold" />
                בחירת קובץ
              </CardTitle>
              <CardDescription className="text-gray-400">
                בחר קובץ וידאו להעלאה (מקסימום 500MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadState.file ? (
                <div
                  className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center cursor-pointer hover:border-spy-gold/50 hover:bg-white/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">גרור קובץ או לחץ לבחירה</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    נתמכים: MP4, MOV, AVI, WebM
                  </p>
                  <Button
                    type="button"
                    className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
                  >
                    בחר קובץ
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <Video className="w-8 h-8 text-spy-gold" />
                    <div className="flex-1">
                      <p className="font-medium text-white">{uploadState.file.name}</p>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(uploadState.file.size)} • {uploadState.file.type}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={resetUpload}
                      className="text-gray-400 hover:text-white"
                      disabled={uploadState.uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          {uploadState.file && (
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>מידע נוסף</CardTitle>
                <CardDescription className="text-gray-400">
                  הגדר מידע על קובץ הוידאו
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">כותרת</Label>
                  <Input
                    id="title"
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="כותרת התבנית..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    disabled={uploadState.uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">תיאור</Label>
                  <Input
                    id="description"
                    type="text"
                    value={metadata.description}
                    onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="תיאור אופציונלי..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    disabled={uploadState.uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">שפה</Label>
                  <Select
                    value={language}
                    onValueChange={(value: 'he' | 'en') => setLanguage(value)}
                    disabled={uploadState.uploading}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="he" className="text-white hover:bg-gray-700">עברית</SelectItem>
                      <SelectItem value="en" className="text-white hover:bg-gray-700">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {uploadState.uploading && (
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="font-medium">מעלה קובץ...</p>
                    <p className="text-sm text-gray-400">אנא המתן עד לסיום ההעלאה</p>
                  </div>
                </div>
                
                <Progress value={uploadState.progress} className="mb-2" />
                <p className="text-sm text-gray-400 text-center">
                  {Math.round(uploadState.progress)}%
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {uploadState.error && (
            <Card className="bg-red-500/20 border-red-500/30 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">שגיאה בהעלאה</p>
                    <p className="text-sm text-gray-300">{uploadState.error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={!uploadState.file || uploadState.uploading}
              className="flex-1 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              {uploadState.uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  העלה וידאו
                </>
              )}
            </Button>
            
            <Link href="/admin/templates">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={uploadState.uploading}
              >
                ביטול
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Success State */
        <Card className="bg-green-500/20 border-green-500/30 text-white">
          <CardContent className="p-8 text-center">
            <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">העלאה הושלמה!</h2>
            <p className="text-gray-300 mb-6">
              הוידאו הועלה בהצלחה. מעביר אותך לעורך ה-Timeline...
            </p>
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}