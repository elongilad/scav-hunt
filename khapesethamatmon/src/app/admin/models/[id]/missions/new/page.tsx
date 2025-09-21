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
import { ArrowLeft, Save, Users, MapPin, Video, Eye } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  to_station_id: string
  title: string
  clue: {
    text: string
    hint?: string
  }
  video_template_id: string | null
  overlay_spec: {
    title_position: { x: number; y: number }
    clue_position: { x: number; y: number }
    font_style: {
      family: string
      size: number
      color: string
      bold: boolean
    }
  }
  locale: 'he' | 'en'
  active: boolean
}

interface Station {
  id: string
  display_name: string
  type: string
}

interface MediaAsset {
  id: string
  storage_path: string
  kind: string
}

interface PageProps {
  params: {
    id: string
  }
}

export default function NewMissionPage({ params }: PageProps) {
  const [formData, setFormData] = useState<FormData>({
    to_station_id: '',
    title: '',
    clue: {
      text: '',
      hint: ''
    },
    video_template_id: null,
    overlay_spec: {
      title_position: { x: 50, y: 20 },
      clue_position: { x: 50, y: 80 },
      font_style: {
        family: 'Assistant',
        size: 24,
        color: '#ffffff',
        bold: true
      }
    },
    locale: 'he',
    active: true
  })
  
  const [stations, setStations] = useState<Station[]>([])
  const [videoTemplates, setVideoTemplates] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadStations()
    loadVideoTemplates()
  }, [])

  const loadStations = async () => {
    try {
      const { data: stations } = await supabase
        .from('model_stations')
        .select('id, display_name, type')
        .eq('model_id', params.id)
        .order('display_name')

      setStations(stations || [])
    } catch (error) {
      console.error('Error loading stations:', error)
    }
  }

  const loadVideoTemplates = async () => {
    try {
      // Get user's org to filter video templates
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)

      if (!orgs || orgs.length === 0) return

      const { data: templates } = await supabase
        .from('media_assets')
        .select('id, storage_path, meta')
        .eq('kind', 'video')
        .in('org_id', orgs.map(org => org.org_id))
        .order('created_at', { ascending: false })

      setVideoTemplates(templates || [])
    } catch (error) {
      console.error('Error loading video templates:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.to_station_id) {
      newErrors.to_station_id = 'יש לבחור עמדת יעד'
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'כותרת המשימה נדרשת'
    }
    
    if (!formData.clue.text.trim()) {
      newErrors.clue_text = 'טקסט הרמז נדרש'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Create mission
      const { error } = await supabase
        .from('model_missions')
        .insert({
          model_id: params.id,
          to_station_id: formData.to_station_id,
          title: formData.title.trim(),
          clue: formData.clue,
          video_template_id: formData.video_template_id,
          overlay_spec: formData.overlay_spec,
          locale: formData.locale,
          active: formData.active
        })

      if (error) throw error

      // Redirect back to model detail page
      router.push(`/admin/models/${params.id}`)
      
    } catch (error: any) {
      console.error('Error creating mission:', error)
      setErrors({ submit: error.message || 'שגיאה ביצירת המשימה' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClueChange = (field: keyof FormData['clue'], value: string) => {
    setFormData(prev => ({
      ...prev,
      clue: { ...prev.clue, [field]: value }
    }))
    // Clear field error when user starts typing
    if (errors[`clue_${field}`]) {
      setErrors(prev => ({ ...prev, [`clue_${field}`]: '' }))
    }
  }

  const selectedStation = stations.find(s => s.id === formData.to_station_id)
  const selectedTemplate = videoTemplates.find(t => t.id === formData.video_template_id)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/models/${params.id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור למודל
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">משימה חדשה</h1>
          <p className="text-gray-300">צור משימה שמובילה לעמדה במודל הציד</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-spy-gold" />
              מידע בסיסי
            </CardTitle>
            <CardDescription className="text-gray-400">
              הגדר את יעד המשימה וכותרת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Target Station */}
            <div className="space-y-2">
              <Label className="text-white">עמדת יעד *</Label>
              <Select
                value={formData.to_station_id}
                onValueChange={(value) => handleInputChange('to_station_id', value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="בחר עמדת יעד" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id} className="text-white hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-spy-gold" />
                        <div>
                          <div className="font-medium">{station.display_name}</div>
                          <div className="text-xs text-gray-400">{station.id} • {station.type}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStation && (
                <div className="p-3 bg-spy-gold/10 border border-spy-gold/20 rounded-lg">
                  <p className="text-spy-gold text-sm">
                    המשימה תוביל לעמדה: {selectedStation.display_name}
                  </p>
                </div>
              )}
              {errors.to_station_id && (
                <p className="text-red-400 text-sm">{errors.to_station_id}</p>
              )}
            </div>

            {/* Mission Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">כותרת המשימה *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={selectedStation ? `לך ל-${selectedStation.display_name}` : "למשל: לך לגן ויצו"}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                כותרת קצרה שתופיע בסרטון המשימה
              </p>
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Language and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">שפה</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('locale', 'he')}
                    className={`px-3 py-1 rounded border transition-colors text-sm ${
                      formData.locale === 'he'
                        ? 'bg-spy-gold text-black border-spy-gold'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    disabled={loading}
                  >
                    עברית
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('locale', 'en')}
                    className={`px-3 py-1 rounded border transition-colors text-sm ${
                      formData.locale === 'en'
                        ? 'bg-spy-gold text-black border-spy-gold'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    disabled={loading}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">סטטוס</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('active', !formData.active)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      formData.active ? 'bg-spy-gold' : 'bg-gray-600'
                    }`}
                    disabled={loading}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                        formData.active ? 'transform translate-x-5' : 'transform translate-x-0.5'
                      }`}
                    />
                  </button>
                  <Badge 
                    variant={formData.active ? "default" : "secondary"}
                    className={formData.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                  >
                    {formData.active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clue Content */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-spy-gold" />
              תוכן הרמז
            </CardTitle>
            <CardDescription className="text-gray-400">
              הרמז שיוביל את הקבוצות לעמדה הבאה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Clue Text */}
            <div className="space-y-2">
              <Label htmlFor="clue_text" className="text-white">טקסט הרמז *</Label>
              <Textarea
                id="clue_text"
                value={formData.clue.text}
                onChange={(e) => handleClueChange('text', e.target.value)}
                placeholder="הרמז שיוביל לעמדה הבאה..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                הרמז הראשי שיופיע במשימה
              </p>
              {errors.clue_text && (
                <p className="text-red-400 text-sm">{errors.clue_text}</p>
              )}
            </div>

            {/* Optional Hint */}
            <div className="space-y-2">
              <Label htmlFor="hint" className="text-white">רמז נוסף</Label>
              <Textarea
                id="hint"
                value={formData.clue.hint || ''}
                onChange={(e) => handleClueChange('hint', e.target.value)}
                placeholder="רמז נוסף שיעזור אם הקבוצה תתקע..."
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                רמז אופציונלי למקרה שהקבוצה תתקע
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Video Template */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-spy-gold" />
              תבנית וידאו
            </CardTitle>
            <CardDescription className="text-gray-400">
              בחר תבנית וידאו למשימה (אופציונלי)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">תבנית וידאו</Label>
              <Select
                value={formData.video_template_id || 'none'}
                onValueChange={(value) => handleInputChange('video_template_id', value === 'none' ? null : value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="בחר תבנית וידאו" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="none" className="text-white hover:bg-gray-700">
                    ללא תבנית וידאו
                  </SelectItem>
                  {videoTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="text-white hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-spy-gold" />
                        <div>
                          <div className="font-medium">{template.storage_path.split('/').pop()}</div>
                          <div className="text-xs text-gray-400">Video Template</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="p-3 bg-spy-gold/10 border border-spy-gold/20 rounded-lg">
                  <p className="text-spy-gold text-sm">
                    תבנית נבחרת: {selectedTemplate.storage_path.split('/').pop()}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400">
                אם לא נבחרה תבנית, המשימה תוצג כטקסט בלבד
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading || stations.length === 0}
            className="flex-1 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                יוצר משימה...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                צור משימה
              </>
            )}
          </Button>
          
          <Link href={`/admin/models/${params.id}`}>
            <Button 
              type="button" 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={loading}
            >
              ביטול
            </Button>
          </Link>
        </div>

        {/* No Stations Warning */}
        {stations.length === 0 && (
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              אין עמדות במודל זה. יש ליצור עמדות לפני יצירת משימות.
            </p>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  )
}