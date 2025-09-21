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
  Plus,
  Edit,
  Settings,
  Eye,
  Trash2
} from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function HuntModelDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  const supabase = createClient()

  // Get hunt model with organization info
  const { data: huntModel, error } = await supabase
    .from('hunt_models')
    .select(`
      id,
      name,
      description,
      locale,
      active,
      created_at,
      org_id,
      orgs (name)
    `)
    .eq('id', params.id)
    .single()

  if (error || !huntModel) {
    notFound()
  }

  // Check user has access to this organization
  await requireOrgAccess(huntModel.org_id, 'viewer')

  // Get stations for this model
  const { data: stations } = await supabase
    .from('model_stations')
    .select('*')
    .eq('model_id', params.id)
    .order('created_at', { ascending: true })

  // Get missions for this model
  const { data: missions } = await supabase
    .from('model_missions')
    .select(`
      *,
      model_stations!inner (display_name)
    `)
    .eq('model_id', params.id)
    .order('created_at', { ascending: true })

  // Get media assets count
  const { data: mediaAssets } = await supabase
    .from('media_assets')
    .select('id, kind')
    .eq('org_id', huntModel.org_id)

  const stats = {
    stations: stations?.length || 0,
    missions: missions?.length || 0,
    mediaAssets: mediaAssets?.length || 0,
    videoAssets: mediaAssets?.filter(m => m.kind === 'video').length || 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/models">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              חזור
            </Button>
          </Link>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{huntModel.name}</h1>
              <Badge 
                variant={huntModel.active ? "default" : "secondary"}
                className={huntModel.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
              >
                {huntModel.active ? 'פעיל' : 'לא פעיל'}
              </Badge>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                {huntModel.locale === 'he' ? 'עברית' : 'English'}
              </Badge>
            </div>
            {huntModel.description && (
              <p className="text-gray-300">{huntModel.description}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              נוצר ב-{new Date(huntModel.created_at).toLocaleDateString('he-IL')} • 
              ארגון: {(huntModel as any).orgs?.name}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link href={`/admin/models/${params.id}/edit`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Edit className="w-4 h-4 mr-2" />
              ערוך
            </Button>
          </Link>
          
          <Link href={`/admin/models/${params.id}/preview`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Eye className="w-4 h-4 mr-2" />
              תצוגה מקדימה
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
                <p className="text-2xl font-bold text-spy-gold">{stats.mediaAssets}</p>
                <p className="text-sm text-gray-400">קבצי מדיה</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stats.videoAssets}</p>
                <p className="text-sm text-gray-400">סרטונים</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stations Section */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-spy-gold" />
                עמדות ({stats.stations})
              </CardTitle>
              <CardDescription className="text-gray-400">
                עמדות במודל הציד הזה
              </CardDescription>
            </div>
            <Link href={`/admin/models/${params.id}/stations/new`}>
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                עמדה חדשה
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stations && stations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-white">{station.display_name}</h4>
                      <p className="text-xs text-gray-400 mt-1">ID: {station.id}</p>
                      {station.type && (
                        <Badge variant="outline" className="text-xs mt-2 border-white/20 text-gray-300">
                          {station.type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/admin/models/${params.id}/stations/${station.id}/edit`}>
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {station.default_activity && (
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {typeof station.default_activity === 'string' 
                        ? station.default_activity 
                        : station.default_activity.description || 'פעילות מותאמת'
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">אין עמדות במודל הזה</p>
              <Link href={`/admin/models/${params.id}/stations/new`}>
                <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף עמדה ראשונה
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missions Section */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-spy-gold" />
                משימות ({stats.missions})
              </CardTitle>
              <CardDescription className="text-gray-400">
                משימות שמקשרות בין העמדות
              </CardDescription>
            </div>
            <Link href={`/admin/models/${params.id}/missions/new`}>
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                משימה חדשה
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
                          {mission.title || `משימה ל-${(mission as any).model_stations.display_name}`}
                        </h4>
                        <Badge 
                          variant={mission.active ? "default" : "secondary"}
                          className={mission.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                        >
                          {mission.active ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        יעד: {(mission as any).model_stations.display_name}
                      </p>
                      
                      {mission.clue && typeof mission.clue === 'object' && mission.clue.text && (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {mission.clue.text}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Link href={`/admin/models/${params.id}/missions/${mission.id}/edit`}>
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
              <p className="text-gray-400 mb-4">אין משימות במודל הזה</p>
              {stats.stations > 0 ? (
                <Link href={`/admin/models/${params.id}/missions/new`}>
                  <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    צור משימה ראשונה
                  </Button>
                </Link>
              ) : (
                <p className="text-gray-500 text-sm">
                  יש ליצור עמדות לפני יצירת משימות
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}