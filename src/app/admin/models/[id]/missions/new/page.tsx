'use client'

import { useState, useEffect, use } from 'react'
import { createMission, getStations } from '@/lib/actions/missions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Users, MapPin, Video, Eye } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface FormData {
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
  params: Promise<{
    id: string
  }>
}

export default function NewMissionPage({ params }: PageProps) {
  const { id } = use(params)
  const { language } = useLanguage()
  const [formData, setFormData] = useState<FormData>({
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
  
  const [videoTemplates, setVideoTemplates] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  useEffect(() => {
    loadVideoTemplates()
  }, [])

  // Note: Stations are no longer part of models

  const loadVideoTemplates = async () => {
    try {
      // TODO: Create server action for video templates to avoid RLS issues
      // For now, skip loading video templates
      setVideoTemplates([])
    } catch (error) {
      console.error('Error loading video templates:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = t('mission_form.mission_title_required_error', language)
    }

    if (!formData.clue.text.trim()) {
      newErrors.clue_text = t('mission_form.clue_text_required_error', language)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const result = await createMission({
        model_id: id,
        title: formData.title,
        clue: formData.clue,
        video_template_id: formData.video_template_id,
        overlay_spec: formData.overlay_spec,
        locale: formData.locale,
        active: formData.active
      })

      if (result?.error) {
        setErrors({ submit: result.error })
        return
      }

      // Success - server action will redirect automatically

    } catch (error: any) {
      console.error('Error creating mission:', error)
      // Don't show NEXT_REDIRECT as an error since it's expected behavior
      if (error.message === 'NEXT_REDIRECT') {
        return
      }
      setErrors({ submit: error.message || t('mission_form.create_error', language) })
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

  const selectedTemplate = videoTemplates.find(t => t.id === formData.video_template_id)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/models/${id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('mission_form.back_to_model', language)}
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">{t('mission_form.new_mission', language)}</h1>
          <p className="text-gray-300">{t('mission_form.create_mission_in_model', language)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-spy-gold" />
              {t('mission_form.basic_info', language)}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('mission_form.set_mission_title', language)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Mission Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">{t('mission_form.mission_title_required', language)}</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('mission_form.mission_title_placeholder', language)}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                {t('mission_form.short_title_description', language)}
              </p>
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Language and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">{t('mission_form.language', language)}</Label>
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
                    {t('mission_form.hebrew', language)}
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
                    {t('mission_form.english', language)}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">{t('mission_form.status', language)}</Label>
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
                    {formData.active ? t('missions.active', language) : t('missions.inactive', language)}
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
              {t('mission_form.clue_content', language)}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('mission_form.clue_description', language)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Clue Text */}
            <div className="space-y-2">
              <Label htmlFor="clue_text" className="text-white">{t('mission_form.clue_text_required', language)}</Label>
              <Textarea
                id="clue_text"
                value={formData.clue.text}
                onChange={(e) => handleClueChange('text', e.target.value)}
                placeholder={t('mission_form.clue_placeholder', language)}
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                {t('mission_form.main_clue_description', language)}
              </p>
              {errors.clue_text && (
                <p className="text-red-400 text-sm">{errors.clue_text}</p>
              )}
            </div>

            {/* Optional Hint */}
            <div className="space-y-2">
              <Label htmlFor="hint" className="text-white">{t('mission_form.additional_hint', language)}</Label>
              <Textarea
                id="hint"
                value={formData.clue.hint || ''}
                onChange={(e) => handleClueChange('hint', e.target.value)}
                placeholder={t('mission_form.additional_hint_placeholder', language)}
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                {t('mission_form.optional_hint_description', language)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Video Template */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-spy-gold" />
              {t('mission_form.video_template', language)}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('mission_form.video_template_description', language)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">{t('mission_form.video_template', language)}</Label>
              <Select
                value={formData.video_template_id || 'none'}
                onValueChange={(value) => handleInputChange('video_template_id', value === 'none' ? null : value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('mission_form.video_template_description', language)} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="none" className="text-white hover:bg-gray-700">
                    {t('mission_form.no_video_template', language)}
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
                    {t('mission_form.template_selected', language)}: {selectedTemplate.storage_path.split('/').pop()}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400">
                {t('mission_form.no_template_description', language)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                {t('mission_form.creating_mission', language)}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('mission_form.create_mission', language)}
              </>
            )}
          </Button>
          
          <Link href={`/admin/models/${id}`}>
            <Button 
              type="button" 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={loading}
            >
              {t('mission_form.cancel', language)}
            </Button>
          </Link>
        </div>


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