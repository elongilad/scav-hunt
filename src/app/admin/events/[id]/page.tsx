import { requireAuth, requireOrgAccess } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Users,
  Video,
  Settings,
  Rocket,
  Eye,
  Edit,
  Calendar,
  Clock,
  Zap,
  Search,
  Route,
  Target,
  Timer
} from 'lucide-react'
import { CompileEventButton } from './CompileEventButton'
import { StationOverridesList } from './StationOverridesList'
import { MissionOverridesList } from './MissionOverridesList'
import { AdvancedFeaturesSection } from './components/AdvancedFeaturesSection'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const user = await requireAuth()
  const supabase = await createClient()

  // Get event with model version info
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      locale,
      status,
      org_id,
      buyer_user_id,
      model_version_id,
      created_at,
      orgs (name),
      model_versions (
        id,
        version_number,
        is_active,
        published_at,
        hunt_models (
          id,
          name,
          description
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  await requireOrgAccess(event.org_id, 'viewer')

  // Get stations from model version snapshots
  const { data: stations } = await supabase
    .from('mv_stations')
    .select('*')
    .eq('version_id', event.model_version_id)
    .order('snapshot_order')

  // Get missions from model version snapshots
  const { data: missions } = await supabase
    .from('mv_missions')
    .select('*')
    .eq('version_id', event.model_version_id)
    .order('snapshot_order')

  // Get station overrides
  const { data: stationOverrides } = await supabase
    .from('event_station_overrides')
    .select('*')
    .eq('event_id', id)
    .order('created_at')

  // Get mission overrides
  const { data: missionOverrides } = await supabase
    .from('event_mission_overrides')
    .select('*')
    .eq('event_id', id)
    .order('created_at')

  // Get render jobs for this event
  const { data: renderJobs } = await supabase
    .from('render_jobs')
    .select('id, job_type, status, created_at, progress_percentage, error_message')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const stats = {
    stations: stations?.length || 0,
    missions: missions?.length || 0,
    stationOverrides: stationOverrides?.filter(o => o.enabled_override).length || 0,
    missionOverrides: missionOverrides?.filter(o => o.enabled_override).length || 0,
    renderJobs: renderJobs?.length || 0,
    completedJobs: renderJobs?.filter(j => j.status === 'completed').length || 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              חזור לאירועים
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
              <Badge
                variant={event.status === 'ready' ? "default" : "secondary"}
                className={event.status === 'ready' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
              >
                {event.status === 'ready' ? 'מוכן' : event.status === 'draft' ? 'טיוטה' : event.status}
              </Badge>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                {event.locale === 'he' ? 'עברית' : 'English'}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">
              נוצר ב-{new Date(event.created_at).toLocaleDateString('he-IL')} •
              ארגון: {(event as any).orgs?.name}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <CompileEventButton eventId={id} />

          <Link href={`/admin/events/${id}/live`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Eye className="w-4 h-4 mr-2" />
              מעקב חי
            </Button>
          </Link>

          <Link href={`/admin/models/${event.model_versions.hunt_models.id}`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Settings className="w-4 h-4 mr-2" />
              המודל
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.stations}</p>
                <p className="text-sm text-gray-400">עמדות</p>
              </div>
              <MapPin className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.missions}</p>
                <p className="text-sm text-gray-400">משימות</p>
              </div>
              <Users className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.stationOverrides + stats.missionOverrides}</p>
                <p className="text-sm text-gray-400">התאמות אישיות</p>
              </div>
              <Edit className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.completedJobs}/{stats.renderJobs}</p>
                <p className="text-sm text-gray-400">עיבוד וידאו</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Version Info */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-spy-gold" />
            מודל ציד - גרסה {event.model_versions.version_number}
          </CardTitle>
          <CardDescription className="text-gray-400">
            מבוסס על {event.model_versions.hunt_models.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{event.model_versions.hunt_models.name}</p>
              <p className="text-gray-300 text-sm">{event.model_versions.hunt_models.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                  גרסה {event.model_versions.version_number}
                </Badge>
                <Badge
                  variant={event.model_versions.is_active ? "default" : "secondary"}
                  className={event.model_versions.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                >
                  {event.model_versions.is_active ? 'פעיל' : 'לא פעיל'}
                </Badge>
                <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(event.model_versions.published_at).toLocaleDateString('he-IL')}
                </Badge>
              </div>
            </div>
            <Link href={`/admin/models/${event.model_versions.hunt_models.id}`}>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Eye className="w-4 h-4 mr-2" />
                צפה במודל
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <AdvancedFeaturesSection eventId={id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Station Overrides */}
        <StationOverridesList
          eventId={id}
          stations={stations || []}
          overrides={stationOverrides || []}
        />

        {/* Mission Overrides */}
        <MissionOverridesList
          eventId={id}
          missions={missions || []}
          overrides={missionOverrides || []}
        />
      </div>

      {/* Render Jobs */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-spy-gold" />
            עיבוד וידאו ({stats.renderJobs})
          </CardTitle>
          <CardDescription className="text-gray-400">
            סטטוס עיבוד הסרטונים לאירוע
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderJobs && renderJobs.length > 0 ? (
            <div className="space-y-3">
              {renderJobs.map((job) => (
                <div key={job.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {job.job_type === 'mission_video' ? 'וידאו משימה' :
                           job.job_type === 'compilation' ? 'קומפילציה' :
                           job.job_type === 'preview' ? 'תצוגה מקדימה' : job.job_type}
                        </span>
                        <Badge
                          variant={
                            job.status === 'completed' ? "default" :
                            job.status === 'processing' ? "secondary" :
                            job.status === 'failed' ? "destructive" : "outline"
                          }
                          className={
                            job.status === 'completed' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            job.status === 'processing' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            job.status === 'failed' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }
                        >
                          {job.status === 'completed' ? 'הושלם' :
                           job.status === 'processing' ? 'מעבד' :
                           job.status === 'failed' ? 'נכשל' :
                           job.status === 'pending' ? 'ממתין' : job.status}
                        </Badge>
                      </div>

                      {job.progress_percentage !== null && job.progress_percentage > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full">
                            <div
                              className="h-full bg-spy-gold rounded-full transition-all"
                              style={{ width: `${job.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{job.progress_percentage}%</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>

                  {job.error_message && (
                    <p className="text-red-400 text-sm mt-2">{job.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">אין עבודות עיבוד וידאו</p>
              <CompileEventButton eventId={id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}