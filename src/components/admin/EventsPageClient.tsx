'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Calendar,
  Users,
  MapPin,
  Eye,
  Settings,
  Plus,
  Zap
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface Event {
  id: string
  title: string
  locale: 'he' | 'en'
  status: string
  created_at: string
  org_id: string
  buyer_user_id?: string
  model_version_id: string
  orgs: { name: string }
  model_versions: {
    version_number: number
    hunt_models: {
      name: string
      description?: string
    }
  }
}

interface RenderStats {
  total: number
  completed: number
  failed: number
  processing: number
}

interface EventsPageClientProps {
  events: Event[]
  renderStatsByEvent: Record<string, RenderStats>
}

export default function EventsPageClient({ events, renderStatsByEvent }: EventsPageClientProps) {
  const { language } = useLanguage()

  const stats = {
    total: events?.length || 0,
    ready: events?.filter(e => e.status === 'ready').length || 0,
    draft: events?.filter(e => e.status === 'draft').length || 0,
    active: events?.filter(e => e.status === 'active').length || 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('events.title', language)}</h1>
          <p className="text-gray-300">{t('events.description', language)}</p>
        </div>

        <Link href="/dashboard/events/new">
          <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            {t('events.new_event', language)}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.total}</p>
                <p className="text-sm text-gray-400">{t('events.total_events', language)}</p>
              </div>
              <Calendar className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
                <p className="text-sm text-gray-400">{t('events.ready_for_launch', language)}</p>
              </div>
              <Eye className="w-8 h-8 text-green-400/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
                <p className="text-sm text-gray-400">{t('events.active_now', language)}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{stats.draft}</p>
                <p className="text-sm text-gray-400">{t('events.drafts', language)}</p>
              </div>
              <Settings className="w-8 h-8 text-yellow-400/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-spy-gold" />
            {t('events.events_list', language)} ({events?.length || 0})
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('events.all_events_description', language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                const renderStats = renderStatsByEvent[event.id] || { total: 0, completed: 0, failed: 0, processing: 0 }

                return (
                  <div
                    key={event.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">{event.title}</h3>
                          <Badge
                            variant={event.status === 'ready' ? "default" : event.status === 'active' ? "default" : "secondary"}
                            className={
                              event.status === 'ready' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                              event.status === 'active' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                              event.status === 'draft' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                              "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {event.status === 'ready' ? t('events.status.ready', language) :
                             event.status === 'active' ? t('events.status.active', language) :
                             event.status === 'draft' ? t('events.status.draft', language) :
                             event.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            {event.locale === 'he' ? t('common.hebrew', language) : t('common.english', language)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                          <span>{t('events.organization', language)}: {event.orgs?.name}</span>
                          <span>•</span>
                          <span>{t('events.version', language)} {event.model_versions?.version_number}</span>
                          <span>•</span>
                          <span>{t('events.created_on', language)} {new Date(event.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}</span>
                        </div>

                        <p className="text-sm text-gray-400">
                          {t('events.based_on', language)}: {event.model_versions?.hunt_models?.name}
                        </p>

                        {/* Render Jobs Status */}
                        {renderStats.total > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Zap className="w-4 h-4 text-spy-gold" />
                            <span className="text-xs text-gray-400">
                              {t('events.video_processing', language)}: {renderStats.completed}/{renderStats.total}
                            </span>
                            {renderStats.failed > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {renderStats.failed} {t('events.failed', language)}
                              </Badge>
                            )}
                            {renderStats.processing > 0 && (
                              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                                {renderStats.processing} {t('events.processing', language)}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/admin/events/${event.id}`}>
                          <Button size="sm" className="bg-spy-gold hover:bg-spy-gold/90 text-black">
                            <Settings className="w-4 h-4 mr-2" />
                            {t('events.manage', language)}
                          </Button>
                        </Link>

                        <Link href={`/admin/events/${event.id}/live`}>
                          <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                            <Eye className="w-4 h-4 mr-2" />
                            {t('events.live_tracking', language)}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">{t('events.no_events_yet', language)}</h3>
              <p className="text-gray-400 mb-6">
                {t('events.no_events_description', language)}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/events/new">
                  <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('events.create_new_event', language)}
                  </Button>
                </Link>
                <Link href="/admin/models">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <MapPin className="w-4 h-4 mr-2" />
                    {t('events.manage_models', language)}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}