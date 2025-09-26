'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import {
  Plus,
  Map,
  Users,
  Video,
  Image,
  CheckCircle
} from 'lucide-react'

interface Stats {
  huntModels: number
  activeModels: number
  mediaAssets: number
  videoAssets: number
  recentEvents: number
  activeEvents: number
}

interface HuntModel {
  id: string
  name: string
  description?: string
  active: boolean
  created_at: string
  org_id: string
}

interface AdminDashboardProps {
  stats: Stats
  huntModels: HuntModel[]
}

export default function AdminDashboard({ stats, huntModels }: AdminDashboardProps) {
  const { language } = useLanguage()

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white font-display">{t('admin.title', language)}</h1>
        <LanguageToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.models', language)}</CardTitle>
            <Map className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">{stats.huntModels}</div>
            <p className="text-xs text-gray-400">
              {stats.activeModels} {t('admin.active', language)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.media', language)}</CardTitle>
            <Image className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">{stats.mediaAssets}</div>
            <p className="text-xs text-gray-400">
              {stats.videoAssets} {t('admin.videos', language)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.events', language)}</CardTitle>
            <Users className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">{stats.recentEvents}</div>
            <p className="text-xs text-gray-400">
              {stats.activeEvents} {t('admin.active', language)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{t('admin.recent_models', language)}</h2>
        <Link href="/admin/models/new">
          <Button className="flex items-center gap-2 bg-brand-teal hover:bg-brand-teal/90 text-white">
            <Plus className="h-4 w-4" />
            {t('admin.new_model', language)}
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {huntModels?.slice(0, 5).map((model) => (
          <div
            key={model.id}
            className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-white">{model.name}</h3>
                <Badge
                  variant={model.active ? 'default' : 'secondary'}
                  className={model.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                >
                  {model.active ? t('admin.ready', language) : t('admin.draft', language)}
                </Badge>
              </div>
              {model.description && (
                <p className="text-gray-400 text-sm">{model.description}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {t('admin.created_on', language)} {new Date(model.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/admin/models/${model.id}`}>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  {t('admin.edit', language)}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}