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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Video, 
  Type,
  Image,
  Play,
  Pause,
  Trash2,
  Move3D,
  Layers,
  Clock,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface VideoTemplateScene {
  id?: string
  order_index: number
  scene_type: 'intro' | 'user_clip' | 'overlay' | 'outro'
  start_ms?: number
  end_ms?: number
  overlay_text?: {
    text?: string
    x: number
    y: number
    style: {
      family: string
      size: number
      color: string
      bold: boolean
      italic: boolean
    }
  }
}

interface MediaAsset {
  id: string
  storage_path: string
  duration_seconds?: number
  language: string
}

interface PageProps {
  params: {
    id: string
  }
}

const SCENE_TYPES = [
  { value: 'intro', label: 'פתיחה', description: 'סצנת פתיחה של התבנית', color: 'bg-blue-500' },
  { value: 'user_clip', label: 'קטע משתמש', description: 'כאן יוכנס הקטע של המשתמש', color: 'bg-green-500' },
  { value: 'overlay', label: 'כיתוב', description: 'טקסט או גרפיקה על הוידאו', color: 'bg-purple-500' },
  { value: 'outro', label: 'סיום', description: 'סצנת סיום של התבנית', color: 'bg-orange-500' }
]

export default function TimelineEditorPage({ params }: PageProps) {
  const [template, setTemplate] = useState<MediaAsset | null>(null)
  const [scenes, setScenes] = useState<VideoTemplateScene[]>([])
  const [selectedScene, setSelectedScene] = useState<VideoTemplateScene | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTemplate()
    loadScenes()
  }, [])

  const loadTemplate = async () => {
    try {
      const { data: template } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', params.id)
        .eq('kind', 'video')
        .single()

      if (template) {
        setTemplate(template)
      }
    } catch (error) {
      console.error('Error loading template:', error)
    }
  }

  const loadScenes = async () => {
    try {
      const { data: scenes } = await supabase
        .from('video_template_scenes')
        .select('*')
        .eq('template_asset_id', params.id)
        .order('order_index')

      setScenes(scenes || [])
    } catch (error) {
      console.error('Error loading scenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const addScene = () => {
    const newScene: VideoTemplateScene = {
      order_index: scenes.length,
      scene_type: 'intro',
      start_ms: 0,
      end_ms: 5000,
      overlay_text: {
        text: '',
        x: 50,
        y: 50,
        style: {
          family: 'Assistant',
          size: 24,
          color: '#ffffff',
          bold: true,
          italic: false
        }
      }
    }
    setScenes([...scenes, newScene])
    setSelectedScene(newScene)
  }

  const updateScene = (index: number, updates: Partial<VideoTemplateScene>) => {
    const newScenes = [...scenes]
    newScenes[index] = { ...newScenes[index], ...updates }
    setScenes(newScenes)
    
    if (selectedScene && scenes[index] === selectedScene) {
      setSelectedScene(newScenes[index])
    }
  }

  const deleteScene = (index: number) => {
    const newScenes = scenes.filter((_, i) => i !== index)
    // Update order indices
    newScenes.forEach((scene, i) => {
      scene.order_index = i
    })
    setScenes(newScenes)
    
    if (selectedScene === scenes[index]) {
      setSelectedScene(null)
    }
  }

  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === scenes.length - 1)
    ) {
      return
    }

    const newScenes = [...scenes]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap scenes
    const temp = newScenes[index]
    newScenes[index] = newScenes[targetIndex]
    newScenes[targetIndex] = temp
    
    // Update order indices
    newScenes.forEach((scene, i) => {
      scene.order_index = i
    })
    
    setScenes(newScenes)
  }

  const saveTimeline = async () => {
    setSaving(true)
    setErrors({})
    
    try {
      // Delete existing scenes
      await supabase
        .from('video_template_scenes')
        .delete()
        .eq('template_asset_id', params.id)

      // Insert new scenes
      if (scenes.length > 0) {
        const scenesToInsert = scenes.map(scene => ({
          template_asset_id: params.id,
          order_index: scene.order_index,
          scene_type: scene.scene_type,
          start_ms: scene.start_ms,
          end_ms: scene.end_ms,
          overlay_text: scene.overlay_text
        }))

        const { error } = await supabase
          .from('video_template_scenes')
          .insert(scenesToInsert)

        if (error) throw error
      }

      // Redirect back to templates
      router.push('/admin/templates')
      
    } catch (error: any) {
      console.error('Error saving timeline:', error)
      setErrors({ submit: error.message || 'שגיאה בשמירת הזמן הזמן' })
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSceneColor = (type: string) => {
    return SCENE_TYPES.find(t => t.value === type)?.color || 'bg-gray-500'
  }

  const totalDuration = template?.duration_seconds ? template.duration_seconds * 1000 : 60000

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">טוען timeline...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">תבנית וידאו לא נמצאה</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/templates">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              חזור
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-white">Timeline Editor</h1>
            <p className="text-gray-300">
              {template.storage_path.split('/').pop()} • {template.duration_seconds ? formatTime(template.duration_seconds * 1000) : 'לא ידוע'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link href={`/admin/templates/${params.id}/preview`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Eye className="w-4 h-4 mr-2" />
              תצוגה מקדימה
            </Button>
          </Link>
          
          <Button
            onClick={saveTimeline}
            disabled={saving}
            className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                שמור Timeline
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline and Video Player */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-spy-gold" />
                נגן וידאו
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-white/10 mb-4">
                {template.embed_url ? (
                  <div className="text-center">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">נגן וידאו יבוא כאן</p>
                    <p className="text-xs text-gray-500 mt-1">משלב עם נגן וידאו אמיתי</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400">וידאו לא זמין</p>
                  </div>
                )}
              </div>
              
              {/* Player Controls */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <span className="text-sm text-gray-400 min-w-0">
                  {formatTime(playhead)}
                </span>
                
                <div className="flex-1">
                  <Slider
                    value={[playhead]}
                    onValueChange={(value) => setPlayhead(value[0])}
                    max={totalDuration}
                    step={100}
                    className="w-full"
                  />
                </div>
                
                <span className="text-sm text-gray-400 min-w-0">
                  {formatTime(totalDuration)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-spy-gold" />
                    Timeline ({scenes.length} scenes)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    גרור והזז לארגון מחדש של הסצנות
                  </CardDescription>
                </div>
                
                <Button
                  onClick={addScene}
                  size="sm"
                  className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף Scene
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenes.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-white/20 rounded-lg">
                    <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">אין scenes בtimeline</p>
                    <Button
                      onClick={addScene}
                      size="sm"
                      className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      הוסף Scene ראשון
                    </Button>
                  </div>
                ) : (
                  scenes.map((scene, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedScene === scene
                          ? 'border-spy-gold bg-spy-gold/10'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedScene(scene)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${getSceneColor(scene.scene_type)}`} />
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {SCENE_TYPES.find(t => t.value === scene.scene_type)?.label}
                              </span>
                              <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                                {index + 1}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-gray-400 mt-1">
                              {scene.start_ms !== undefined && scene.end_ms !== undefined && (
                                <span>
                                  {formatTime(scene.start_ms)} - {formatTime(scene.end_ms)}
                                </span>
                              )}
                              
                              {scene.scene_type === 'overlay' && scene.overlay_text?.text && (
                                <span className="ml-2">
                                  • "{scene.overlay_text.text.substring(0, 30)}..."
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveScene(index, 'up')
                            }}
                            disabled={index === 0}
                            className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                          >
                            ↑
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveScene(index, 'down')
                            }}
                            disabled={index === scenes.length - 1}
                            className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                          >
                            ↓
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteScene(index)
                            }}
                            className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scene Properties Panel */}
        <div className="space-y-6">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-spy-gold" />
                מאפייני Scene
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedScene ? (
                <div className="space-y-4">
                  {/* Scene Type */}
                  <div className="space-y-2">
                    <Label className="text-white">סוג Scene</Label>
                    <Select
                      value={selectedScene.scene_type}
                      onValueChange={(value: any) => {
                        const index = scenes.indexOf(selectedScene)
                        updateScene(index, { scene_type: value })
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {SCENE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${type.color}`} />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-400">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white">התחלה (ms)</Label>
                      <Input
                        type="number"
                        value={selectedScene.start_ms || 0}
                        onChange={(e) => {
                          const index = scenes.indexOf(selectedScene)
                          updateScene(index, { start_ms: parseInt(e.target.value) || 0 })
                        }}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">סיום (ms)</Label>
                      <Input
                        type="number"
                        value={selectedScene.end_ms || 0}
                        onChange={(e) => {
                          const index = scenes.indexOf(selectedScene)
                          updateScene(index, { end_ms: parseInt(e.target.value) || 0 })
                        }}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  {/* Overlay Text (for overlay scenes) */}
                  {selectedScene.scene_type === 'overlay' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white">טקסט</Label>
                        <Textarea
                          value={selectedScene.overlay_text?.text || ''}
                          onChange={(e) => {
                            const index = scenes.indexOf(selectedScene)
                            updateScene(index, {
                              overlay_text: {
                                ...selectedScene.overlay_text,
                                text: e.target.value,
                                x: selectedScene.overlay_text?.x || 50,
                                y: selectedScene.overlay_text?.y || 50,
                                style: selectedScene.overlay_text?.style || {
                                  family: 'Assistant',
                                  size: 24,
                                  color: '#ffffff',
                                  bold: true,
                                  italic: false
                                }
                              }
                            })
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          placeholder="הכנס טקסט לכיתוב..."
                          rows={3}
                        />
                      </div>

                      {/* Position */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-white">מיקום X (%)</Label>
                          <Slider
                            value={[selectedScene.overlay_text?.x || 50]}
                            onValueChange={(value) => {
                              const index = scenes.indexOf(selectedScene)
                              updateScene(index, {
                                overlay_text: {
                                  ...selectedScene.overlay_text,
                                  x: value[0],
                                  y: selectedScene.overlay_text?.y || 50,
                                  text: selectedScene.overlay_text?.text || '',
                                  style: selectedScene.overlay_text?.style || {
                                    family: 'Assistant',
                                    size: 24,
                                    color: '#ffffff',
                                    bold: true,
                                    italic: false
                                  }
                                }
                              })
                            }}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">מיקום Y (%)</Label>
                          <Slider
                            value={[selectedScene.overlay_text?.y || 50]}
                            onValueChange={(value) => {
                              const index = scenes.indexOf(selectedScene)
                              updateScene(index, {
                                overlay_text: {
                                  ...selectedScene.overlay_text,
                                  y: value[0],
                                  x: selectedScene.overlay_text?.x || 50,
                                  text: selectedScene.overlay_text?.text || '',
                                  style: selectedScene.overlay_text?.style || {
                                    family: 'Assistant',
                                    size: 24,
                                    color: '#ffffff',
                                    bold: true,
                                    italic: false
                                  }
                                }
                              })
                            }}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Font Size */}
                      <div className="space-y-2">
                        <Label className="text-white">גודל גופן</Label>
                        <Slider
                          value={[selectedScene.overlay_text?.style?.size || 24]}
                          onValueChange={(value) => {
                            const index = scenes.indexOf(selectedScene)
                            updateScene(index, {
                              overlay_text: {
                                ...selectedScene.overlay_text,
                                x: selectedScene.overlay_text?.x || 50,
                                y: selectedScene.overlay_text?.y || 50,
                                text: selectedScene.overlay_text?.text || '',
                                style: {
                                  ...selectedScene.overlay_text?.style,
                                  size: value[0],
                                  family: selectedScene.overlay_text?.style?.family || 'Assistant',
                                  color: selectedScene.overlay_text?.style?.color || '#ffffff',
                                  bold: selectedScene.overlay_text?.style?.bold || true,
                                  italic: selectedScene.overlay_text?.style?.italic || false
                                }
                              }
                            })
                          }}
                          min={12}
                          max={72}
                          step={2}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-400">
                          {selectedScene.overlay_text?.style?.size || 24}px
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">בחר scene לעריכה</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scene Types Reference */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-lg">סוגי Scenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SCENE_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${type.color}`} />
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-400">{type.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}
    </div>
  )
}