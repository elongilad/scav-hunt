'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Plus,
  Map,
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  Search
} from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface HuntModel {
  id: string
  name: string
  description?: string
  locale: 'he' | 'en'
  active: boolean
  created_at: string
  org_id: string
}

interface ModelsPageClientProps {
  huntModels: HuntModel[]
  stationCountsByModel: Record<string, number>
  missionCountsByModel: Record<string, number>
}

export default function ModelsPageClient({
  huntModels: initialModels,
  stationCountsByModel,
  missionCountsByModel
}: ModelsPageClientProps) {
  const { language } = useLanguage()
  const [huntModels, setHuntModels] = useState(initialModels)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDeleteModel = async (modelId: string, modelName: string) => {
    const confirmMessage = language === 'he'
      ? `האם אתה בטוח שברצונך למחוק את המודל "${modelName}"? פעולה זו אינה ניתנת לביטול.`
      : `Are you sure you want to delete the model "${modelName}"? This action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsDeleting(modelId)

    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete model')
      }

      // Remove from local state
      setHuntModels(models => models.filter(model => model.id !== modelId))

      // Success - no popup needed, the UI update is enough feedback
    } catch (error) {
      console.error('Error deleting model:', error)
      const errorMessage = language === 'he'
        ? 'שגיאה במחיקת המודל'
        : 'Error deleting model'
      alert(errorMessage)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('models.title', language)}
          </h1>
          <p className="text-gray-300">
            {t('models.description', language)}
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/admin/models/new">
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {t('models.new', language)}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={language === 'he' ? 'חפש מודלי ציד...' : 'Search hunt models...'}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                {language === 'he' ? 'כל המודלים' : 'All Models'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                {language === 'he' ? 'פעילים בלבד' : 'Active Only'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models Grid */}
      {huntModels && huntModels.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {huntModels.map((model) => (
            <Card key={model.id} className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{model.name}</CardTitle>
                      <Badge
                        variant={model.active ? "default" : "secondary"}
                        className={model.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                      >
                        {model.active ? t('common.active', language) : t('model_detail.inactive', language)}
                      </Badge>
                    </div>

                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                      {model.locale === 'he' ? t('common.hebrew', language) : t('common.english', language)}
                    </Badge>
                  </div>

                  <div className="w-12 h-12 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                    <Map className="w-6 h-6 text-spy-gold" />
                  </div>
                </div>

                {model.description && (
                  <CardDescription className="text-gray-300 line-clamp-2">
                    {model.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-spy-gold">
                      {stationCountsByModel[model.id] || 0}
                    </div>
                    <div className="text-xs text-gray-400">
                      {language === 'he' ? 'עמדות' : 'Stations'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-spy-gold">
                      {missionCountsByModel[model.id] || 0}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t('models.missions', language)}
                    </div>
                  </div>
                </div>

                {/* Organization */}
                <div className="text-xs text-gray-400">
                  {language === 'he' ? 'ארגון:' : 'Organization:'} {model.org_id}
                </div>

                {/* Created Date */}
                <div className="text-xs text-gray-500">
                  {t('common.created', language)} {new Date(model.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link href={`/admin/models/${model.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Edit className="w-4 h-4 mr-2" />
                      {t('common.edit', language)}
                    </Button>
                  </Link>

                  <Link href={`/admin/models/${model.id}/preview`}>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                    onClick={() => handleDeleteModel(model.id, model.name)}
                    disabled={isDeleting === model.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="text-center py-12">
            <Map className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              {t('models.no_missions', language)}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === 'he' ? 'צור את המודל הראשון שלך כדי להתחיל לבנות מסעות ציד אוצרות מקצועיים' : 'Create your first model to start building professional treasure hunts'}
            </p>
            <Link href="/admin/models/new">
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'he' ? 'צור מודל ראשון' : 'Create First Model'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Guide */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-spy-gold" />
            {language === 'he' ? 'מדריך מהיר' : 'Quick Guide'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {language === 'he' ? 'איך ליצור מודל ציד אוצרות משלך' : 'How to create your own treasure hunt model'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">
                {language === 'he' ? 'צור מודל' : 'Create Model'}
              </h4>
              <p className="text-sm text-gray-400">
                {language === 'he' ? 'התחל בהגדרת שם, תיאור ושפה למודל החדש' : 'Start by setting up name, description and language for the new model'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">
                {language === 'he' ? 'הוסף עמדות' : 'Add Stations'}
              </h4>
              <p className="text-sm text-gray-400">
                {language === 'he' ? 'צור עמדות שונות עם הוראות ופעילויות' : 'Create different stations with instructions and activities'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">
                {language === 'he' ? 'צור משימות' : 'Create Missions'}
              </h4>
              <p className="text-sm text-gray-400">
                {language === 'he' ? 'הגדר משימות שמקשרות בין העמדות עם רמזים וסרטונים' : 'Set up missions that connect stations with clues and videos'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}