'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { updateMission, getMission, getStations } from '@/lib/actions/missions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Users } from 'lucide-react'
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
  locale: 'he' | 'en'
  active: boolean
}

interface PageProps {
  params: Promise<{
    id: string
    missionId: string
  }>
}

export default function EditMissionPage({ params }: PageProps) {
  const { id: modelId, missionId } = use(params)
  const { language } = useLanguage()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    clue: {
      text: '',
      hint: ''
    },
    video_template_id: null,
    locale: 'he',
    active: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Note: Stations are no longer part of models

  const router = useRouter()

  // Load mission data
  useEffect(() => {
    async function loadMission() {
      try {
        const result = await getMission(missionId)
        if (result.error) {
          setErrors({ submit: result.error })
          return
        }

        if (result.mission) {
          setFormData({
            title: result.mission.title,
            clue: result.mission.clue,
            video_template_id: result.mission.video_template_id,
            locale: result.mission.locale,
            active: result.mission.active
          })
        }

      } catch (error: any) {
        console.error('Error loading mission:', error)
        setErrors({ submit: error.message || t('mission_edit.error_loading', language) })
      } finally {
        setLoading(false)
      }
    }

    loadMission()
  }, [missionId])

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

    setSaving(true)

    try {
      const result = await updateMission(missionId, {
        model_id: modelId,
        title: formData.title,
        clue: formData.clue,
        video_template_id: formData.video_template_id,
        locale: formData.locale,
        active: formData.active
      })

      if (result?.error) {
        setErrors({ submit: result.error })
        return
      }

      // Success - server action will redirect automatically

    } catch (error: any) {
      console.error('Error updating mission:', error)
      // Don't show NEXT_REDIRECT as an error since it's expected behavior
      if (error.message === 'NEXT_REDIRECT') {
        return
      }
      setErrors({ submit: error.message || t('mission_edit.error_updating', language) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white ml-3">{t('mission_edit.loading', language)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/models/${modelId}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
{t('mission_edit.back_to_model', language)}
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white">{t('mission_edit.title', language)}</h1>
          <p className="text-gray-300">{t('mission_edit.subtitle', language)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-spy-gold" />
{t('mission_edit.mission_details', language)}
            </CardTitle>
            <CardDescription className="text-gray-400">
{t('mission_edit.edit_basic_info', language)}
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
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('mission_form.mission_title_placeholder', language)}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={saving}
              />
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title}</p>
              )}
            </div>


            {/* Clue Text */}
            <div className="space-y-2">
              <Label htmlFor="clue_text" className="text-white">{t('mission_form.clue_text_required', language)}</Label>
              <Textarea
                id="clue_text"
                value={formData.clue.text}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  clue: { ...prev.clue, text: e.target.value }
                }))}
                placeholder={t('mission_form.clue_placeholder', language)}
                rows={4}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={saving}
              />
              {errors.clue_text && (
                <p className="text-red-400 text-sm">{errors.clue_text}</p>
              )}
            </div>

            {/* Hint */}
            <div className="space-y-2">
              <Label htmlFor="hint" className="text-white">{t('mission_form.additional_hint', language)}</Label>
              <Textarea
                id="hint"
                value={formData.clue.hint || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  clue: { ...prev.clue, hint: e.target.value }
                }))}
                placeholder={t('mission_form.additional_hint_placeholder', language)}
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={saving}
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-white">{t('mission_form.language', language)}</Label>
              <Select
                value={formData.locale}
                onValueChange={(value: 'he' | 'en') => setFormData(prev => ({ ...prev, locale: value }))}
                disabled={saving}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="he" className="text-white hover:bg-gray-700">{t('common.hebrew', language)}</SelectItem>
                  <SelectItem value="en" className="text-white hover:bg-gray-700">{t('common.english', language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked as boolean }))}
                disabled={saving}
              />
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-white">{t('missions.active', language)}</Label>
                <p className="text-sm text-gray-400">{t('missions.active_description', language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
{t('mission_edit.saving', language)}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
{t('mission_edit.save_changes', language)}
              </>
            )}
          </Button>

          <Link href={`/admin/models/${modelId}`}>
            <Button
              type="button"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={saving}
            >
{t('mission_edit.cancel', language)}
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