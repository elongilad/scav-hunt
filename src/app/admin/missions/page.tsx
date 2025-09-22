import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Users, 
  Search,
  Eye,
  Edit,
  Plus,
  Video,
  FileText,
  MapPin
} from 'lucide-react'

export default async function MissionsOverviewPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get all missions across all hunt models for user's organizations
  const { data: missions } = await supabase
    .from('model_missions')
    .select(`
      id,
      title,
      clue,
      video_template_id,
      locale,
      active,
      created_at,
      model_id,
      to_station_id,
      hunt_models!inner (
        name,
        org_id,
        orgs (name)
      ),
      model_stations!inner (
        display_name
      )
    `)
    .in('hunt_models.org_id', orgs.map(org => org.id))
    .order('created_at', { ascending: false })

  // Get stats
  const totalMissions = missions?.length || 0
  const activeMissions = missions?.filter(m => m.active).length || 0
  const missionsWithVideo = missions?.filter(m => m.video_template_id).length || 0
  const hebrewMissions = missions?.filter(m => m.locale === 'he').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">משימות</h1>
          <p className="text-gray-300">
            כל המשימות במודלי הציד שלך
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/admin/models">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Plus className="w-4 h-4 mr-2" />
              מודל חדש
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
                <p className="text-2xl font-bold text-spy-gold">{totalMissions}</p>
                <p className="text-sm text-gray-400">סה"כ משימות</p>
              </div>
              <Users className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{activeMissions}</p>
                <p className="text-sm text-gray-400">משימות פעילות</p>
              </div>
              <FileText className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{missionsWithVideo}</p>
                <p className="text-sm text-gray-400">עם וידאו</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{hebrewMissions}</p>
                <p className="text-sm text-gray-400">בעברית</p>
              </div>
              <FileText className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="חפש משימות..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                כל המשימות
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                פעילות בלבד
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                עם וידאו
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions List */}
      {missions && missions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <Card key={mission.id} className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {mission.title || `משימה ל-${(mission as any).model_stations.display_name}`}
                      </CardTitle>
                      <Badge 
                        variant={mission.active ? "default" : "secondary"}
                        className={mission.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                      >
                        {mission.active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        {mission.locale === 'he' ? 'עברית' : 'English'}
                      </Badge>
                      {mission.video_template_id && (
                        <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                          <Video className="w-3 h-3 mr-1" />
                          וידאו
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 text-spy-gold" />
                      <span>יעד: {(mission as any).model_stations.display_name}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300">
                      מודל: {(mission as any).hunt_models.name}
                    </p>
                  </div>
                  
                  <div className="w-10 h-10 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-spy-gold" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Clue Preview */}
                {mission.clue && typeof mission.clue === 'object' && mission.clue.text && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-gray-300 line-clamp-2">
                      "{mission.clue.text}"
                    </p>
                  </div>
                )}
                
                {/* Organization */}
                <div className="text-xs text-gray-400">
                  ארגון: {(mission as any).hunt_models.orgs?.name}
                </div>
                
                {/* Created Date */}
                <div className="text-xs text-gray-500">
                  נוצר ב-{new Date(mission.created_at).toLocaleDateString('he-IL')}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link href={`/admin/models/${mission.model_id}/missions/${mission.id}/edit`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Edit className="w-4 h-4 mr-2" />
                      ערוך
                    </Button>
                  </Link>
                  
                  <Link href={`/admin/models/${mission.model_id}`}>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">אין משימות</h3>
            <p className="text-gray-500 mb-6">
              צור מודל ציד עם עמדות כדי להתחיל להוסיף משימות
            </p>
            <Link href="/admin/models/new">
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                צור מודל ראשון
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats by Hunt Model */}
      {missions && missions.length > 0 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>פילוח לפי מודלי ציד</CardTitle>
            <CardDescription className="text-gray-400">
              מספר המשימות בכל מודל ציד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                missions.reduce((acc, mission) => {
                  const modelName = (mission as any).hunt_models.name
                  acc[modelName] = (acc[modelName] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([modelName, count]) => (
                <div key={modelName} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="font-medium">{modelName}</span>
                  <Badge variant="outline" className="border-white/20 text-gray-300">
                    {count} משימות
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}