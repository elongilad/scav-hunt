'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Eye, Users } from 'lucide-react'
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

interface Mission {
  id: string
  title?: string
  clue: {
    text: string
    hint?: string
  }
  active: boolean
  created_at: string
}

interface PreviewPageClientProps {
  huntModel: HuntModel
  missions: Mission[]
}

export default function PreviewPageClient({ huntModel, missions }: PreviewPageClientProps) {
  const { language } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/models/${huntModel.id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('preview.back_to_model', language)}
          </Button>
        </Link>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{t('preview.title', language)}</h1>
            <Badge
              variant={huntModel.active ? "default" : "secondary"}
              className={huntModel.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
            >
              {huntModel.active ? t('common.active', language) : t('missions.inactive', language)}
            </Badge>
          </div>
          <p className="text-gray-300">{t('preview.description', language)}: {huntModel.name}</p>
        </div>
      </div>

      {/* Model Info */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-spy-gold" />
            {t('preview.model_details', language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-white mb-1">{huntModel.name}</h3>
              {huntModel.description && (
                <p className="text-gray-400">{huntModel.description}</p>
              )}
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">
                {t('preview.language', language)}: {huntModel.locale === 'he' ? t('common.hebrew', language) : t('common.english', language)}
              </span>
              <span className="text-gray-400">
                {t('preview.created', language)}: {new Date(huntModel.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions Preview */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-spy-gold" />
            {t('preview.missions', language)} ({missions?.length || 0})
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('preview.missions_description', language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missions && missions.length > 0 ? (
            <div className="space-y-4">
              {missions.map((mission, index) => (
                <div
                  key={mission.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">
                          {mission.title || t('preview.untitled_mission', language)}
                        </h4>
                        <Badge
                          variant={mission.active ? "default" : "secondary"}
                          className={mission.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                        >
                          {mission.active ? t('missions.active', language) : t('missions.inactive', language)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {mission.clue && typeof mission.clue === 'object' && mission.clue.text && (
                    <div className="mt-3 p-3 bg-spy-gold/10 rounded border border-spy-gold/20">
                      <p className="text-sm text-spy-gold font-medium mb-1">{t('preview.clue', language)}:</p>
                      <p className="text-sm text-white">{mission.clue.text}</p>
                      {mission.clue.hint && (
                        <p className="text-xs text-gray-300 mt-1">{t('preview.additional_hint', language)}: {mission.clue.hint}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">{t('preview.no_missions', language)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}