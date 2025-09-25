'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Users,
  Video,
  Plus,
  Edit,
  Eye,
  Rocket,
  Settings
} from 'lucide-react'
import { PublishModelButton } from '@/app/admin/models/[id]/PublishModelButton'
import { CreateEventButton } from '@/app/admin/models/[id]/CreateEventButton'
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
  clue?: {
    text: string
    hint?: string
  }
  active: boolean
  created_at: string
}

interface LatestVersion {
  id: string
  version_number: number
  is_active: boolean
  published_at: string
}

interface Stats {
  missions: number
  mediaAssets: number
  videoAssets: number
  publishedVersions: number
}

interface ModelDetailClientProps {
  huntModel: HuntModel
  missions: Mission[]
  stats: Stats
  latestVersion?: LatestVersion
}

export default function ModelDetailClient({ huntModel, missions, stats, latestVersion }: ModelDetailClientProps) {
  const { language } = useLanguage()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/models">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('model_detail.back', language)}
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{huntModel.name}</h1>
              <Badge
                variant={huntModel.active ? "default" : "secondary"}
                className={huntModel.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
              >
                {huntModel.active ? t('model_detail.active', language) : t('model_detail.inactive', language)}
              </Badge>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                {huntModel.locale === 'he' ? t('model_detail.hebrew', language) : t('model_detail.english', language)}
              </Badge>
            </div>
            {huntModel.description && (
              <p className="text-gray-300">{huntModel.description}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {t('model_detail.created_on', language)}-{new Date(huntModel.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')} •
              {t('model_detail.organization', language)}: {huntModel.org_id}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <PublishModelButton huntModelId={huntModel.id} />

          {latestVersion && (
            <CreateEventButton modelVersionId={latestVersion.id} />
          )}

          <Link href={`/admin/models/${huntModel.id}/edit`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Edit className="w-4 h-4 mr-2" />
              {t('model_detail.edit', language)}
            </Button>
          </Link>

          <Link href={`/admin/models/${huntModel.id}/preview`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Eye className="w-4 h-4 mr-2" />
              {t('model_detail.preview', language)}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.missions}</p>
                <p className="text-sm text-gray-400">{t('model_detail.missions', language)}</p>
              </div>
              <Users className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.mediaAssets}</p>
                <p className="text-sm text-gray-400">{t('model_detail.media_files', language)}</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.publishedVersions}</p>
                <p className="text-sm text-gray-400">{t('model_detail.published_versions', language)}</p>
              </div>
              <Rocket className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missions Section */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-spy-gold" />
                {t('model_detail.missions', language)} ({stats.missions})
              </CardTitle>
              <CardDescription className="text-gray-400">
                {t('model_detail.missions_in_model', language)}
              </CardDescription>
            </div>
            <Link href={`/admin/models/${huntModel.id}/missions/new`}>
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                {t('model_detail.new_mission', language)}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {missions && missions.length > 0 ? (
            <div className="space-y-4">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">
                          {mission.title || t('model_detail.untitled_mission', language)}
                        </h4>
                        <Badge
                          variant={mission.active ? "default" : "secondary"}
                          className={mission.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                        >
                          {mission.active ? t('model_detail.active', language) : t('model_detail.inactive', language)}
                        </Badge>
                      </div>

                      {mission.clue && typeof mission.clue === 'object' && mission.clue.text && (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {mission.clue.text}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Link href={`/admin/models/${huntModel.id}/missions/${mission.id}/edit`}>
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">{t('model_detail.no_missions', language)}</p>
              <Link href={`/admin/models/${huntModel.id}/missions/new`}>
                <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('model_detail.create_first_mission', language)}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}