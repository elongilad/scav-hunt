'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Upload,
  Video,
  Image,
  Music,
  FileText,
  Trash2,
  Play,
  Download,
  Eye,
  Edit,
  Mic,
  Camera,
  Film
} from 'lucide-react'
import Link from 'next/link'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: number
  url: string
  uploaded: boolean
  progress: number
  file?: File
  description?: string
  usage?: string
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function EventMediaPage({ params }: PageProps) {
  const { id } = use(params)
  const [event, setEvent] = useState<any>(null)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [uploadQueue, setUploadQueue] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all')
  
  const router = useRouter()
  const supabase = createClient()

  const loadEventData = useCallback(async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          id,
          child_name,
          status,
          hunt_models (name)
        `)
        .eq('id', id)
        .single()

      setEvent(eventData)
    } catch (error) {
      console.error('Error loading event:', error)
    }
  }, [supabase, id])

  const loadMediaFiles = useCallback(async () => {
    try {
      // Load existing media files for this event
      const { data: existingMedia } = await supabase
        .from('event_media')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      const formattedMedia: MediaFile[] = existingMedia?.map(media => ({
        id: media.id,
        name: media.file_name,
        type: media.media_type as any,
        size: media.file_size || 0,
        url: media.storage_path,
        uploaded: true,
        progress: 100,
        description: media.description,
        usage: media.usage_context
      })) || []

      setMediaFiles(formattedMedia)
    } catch (error) {
      console.error('Error loading media files:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    loadEventData()
    loadMediaFiles()
  }, [loadEventData, loadMediaFiles])

  const handleFileSelect = (files: FileList) => {
    const newFiles: MediaFile[] = Array.from(files).map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: getFileType(file.type),
      size: file.size,
      url: URL.createObjectURL(file),
      uploaded: false,
      progress: 0,
      file,
      description: '',
      usage: 'general'
    }))

    setUploadQueue(prev => [...prev, ...newFiles])
  }

  const getFileType = (mimeType: string): 'image' | 'video' | 'audio' | 'document' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" aria-hidden="true" />
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadFiles = async () => {
    if (uploadQueue.length === 0) return

    setUploading(true)
    
    for (const mediaFile of uploadQueue) {
      if (!mediaFile.file) continue

      try {
        // Update progress
        setUploadQueue(prev => 
          prev.map(f => f.id === mediaFile.id ? { ...f, progress: 0 } : f)
        )

        // Generate file path
        const fileExt = mediaFile.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `events/${id}/media/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, mediaFile.file)

        if (uploadError) throw uploadError

        // Set upload progress to 100% after successful upload
        setUploadQueue(prev =>
          prev.map(f => f.id === mediaFile.id ? { ...f, progress: 100 } : f)
        )

        // Create media record in database
        const { data: mediaRecord, error: dbError } = await supabase
          .from('event_media')
          .insert({
            event_id: id,
            file_name: mediaFile.name,
            media_type: mediaFile.type,
            storage_path: filePath,
            file_size: mediaFile.size,
            description: mediaFile.description,
            usage_context: mediaFile.usage
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Move to uploaded files
        const uploadedFile: MediaFile = {
          id: mediaRecord.id,
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size,
          url: filePath,
          uploaded: true,
          progress: 100,
          description: mediaFile.description,
          usage: mediaFile.usage
        }

        setMediaFiles(prev => [uploadedFile, ...prev])
        setUploadQueue(prev => prev.filter(f => f.id !== mediaFile.id))

      } catch (error) {
        console.error('Upload error:', error)
        // Mark as failed
        setUploadQueue(prev => 
          prev.map(f => f.id === mediaFile.id ? { ...f, progress: -1 } : f)
        )
      }
    }

    setUploading(false)
  }

  const updateQueueFile = (id: string, updates: Partial<MediaFile>) => {
    setUploadQueue(prev => 
      prev.map(f => f.id === id ? { ...f, ...updates } : f)
    )
  }

  const removeFromQueue = (id: string) => {
    setUploadQueue(prev => prev.filter(f => f.id !== id))
  }

  const deleteMediaFile = async (id: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('event_media')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from state
      setMediaFiles(prev => prev.filter(f => f.id !== id))
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const filteredMedia = selectedCategory === 'all' 
    ? mediaFiles 
    : mediaFiles.filter(f => f.type === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">טוען קבצי מדיה...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">מדיה ותוכן</h1>
          <p className="text-gray-300">
            נהל תמונות, וידאו ותוכן עבור {event?.child_name ? `ציד של ${event.child_name}` : 'האירוע'}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-spy-gold" />
            העלאת קבצים
          </CardTitle>
          <CardDescription className="text-gray-400">
            גרור קבצים או לחץ לבחירה. נתמכים: תמונות, וידאו, אודיו ומסמכים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center cursor-pointer hover:border-spy-gold/50 hover:bg-white/5 transition-colors"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">גרור קבצים או לחץ לבחירה</h3>
            <p className="text-gray-400 text-sm mb-4">
              תמונות, וידאו, אודיו ומסמכים עד 100MB לקובץ
            </p>
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
              בחר קבצים
            </Button>
          </div>
          
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>תור העלאה ({uploadQueue.length} קבצים)</CardTitle>
              <Button
                onClick={uploadFiles}
                disabled={uploading}
                className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    מעלה...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    העלה הכל
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadQueue.map((file) => (
                <div key={file.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="text-spy-gold">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-gray-400">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromQueue(file.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label className="text-xs text-gray-400">תיאור</Label>
                          <Input
                            value={file.description || ''}
                            onChange={(e) => updateQueueFile(file.id, { description: e.target.value })}
                            placeholder="תיאור הקובץ..."
                            className="bg-white/10 border-white/20 text-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-400">שימוש</Label>
                          <select
                            value={file.usage || 'general'}
                            onChange={(e) => updateQueueFile(file.id, { usage: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                          >
                            <option value="general">כללי</option>
                            <option value="station_photo">תמונת עמדה</option>
                            <option value="clue_image">תמונת רמז</option>
                            <option value="instruction_video">וידאו הוראות</option>
                            <option value="background_music">מוזיקת רקע</option>
                            <option value="completion_video">וידאו השלמה</option>
                          </select>
                        </div>
                      </div>
                      
                      {file.progress > 0 && file.progress < 100 && (
                        <div>
                          <Progress value={file.progress} className="mb-1" />
                          <p className="text-xs text-gray-400">{Math.round(file.progress)}%</p>
                        </div>
                      )}
                      
                      {file.progress === -1 && (
                        <p className="text-red-400 text-sm">שגיאה בהעלאה</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Library */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>ספריית מדיה</CardTitle>
              <CardDescription className="text-gray-400">
                {filteredMedia.length} קבצים
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              {['all', 'image', 'video', 'audio', 'document'].map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category as any)}
                  className={selectedCategory === category 
                    ? "bg-spy-gold text-black" 
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }
                >
                  {category === 'all' && 'הכל'}
                  {category === 'image' && 'תמונות'}
                  {category === 'video' && 'וידאו'}
                  {category === 'audio' && 'אודיו'}
                  {category === 'document' && 'מסמכים'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedia.map((file) => (
                <div key={file.id} className="bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-spy-gold">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteMediaFile(file.id)}
                        className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-white mb-1 truncate">{file.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                  
                  {file.description && (
                    <p className="text-xs text-gray-300 mb-2">{file.description}</p>
                  )}
                  
                  {file.usage && (
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                      {file.usage === 'general' && 'כללי'}
                      {file.usage === 'station_photo' && 'תמונת עמדה'}
                      {file.usage === 'clue_image' && 'תמונת רמז'}
                      {file.usage === 'instruction_video' && 'וידאו הוראות'}
                      {file.usage === 'background_music' && 'מוזיקת רקע'}
                      {file.usage === 'completion_video' && 'וידאו השלמה'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                {selectedCategory === 'all' ? 'אין קבצי מדיה' : `אין קבצי ${selectedCategory}`}
              </h3>
              <p className="text-gray-500 mb-6">
                העלה קבצים כדי להתחיל לבנות את ספריית המדיה
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>המלצות שימוש</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-spy-gold" />
                תמונות
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• צלם את מיקומי העמדות לפני האירוע</li>
                <li>• הכן תמונות רמזים ומפות</li>
                <li>• תמונות איכות גבוהה למסכי טלפון</li>
                <li>• פורמטים: JPG, PNG</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Video className="w-4 h-4 text-spy-gold" />
                וידאו
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• וידאו הוראות לעמדות מורכבות</li>
                <li>• סרטוני השלמה ומשימות</li>
                <li>• רזולוציה: 1080p מומלצת</li>
                <li>• פורמטים: MP4, MOV</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Mic className="w-4 h-4 text-spy-gold" />
                אודיו
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• מוזיקת רקע לאירוע</li>
                <li>• הוראות קוליות</li>
                <li>• צלילי אפקטים</li>
                <li>• פורמטים: MP3, WAV</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-spy-gold" />
                מסמכים
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• מדריכי הפעלה למארגנים</li>
                <li>• רשימות אביזרים</li>
                <li>• תעודות והישגים</li>
                <li>• פורמטים: PDF, DOC</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}