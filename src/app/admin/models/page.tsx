import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
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

export default async function HuntModelsPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get all hunt models for user's organizations
  const { data: huntModels } = await supabase
    .from('hunt_models')
    .select(`
      id,
      name,
      description,
      locale,
      active,
      created_at,
      orgs (name)
    `)
    .in('org_id', orgs.map(org => org.id))
    .order('created_at', { ascending: false })

  // Get station counts for each model
  const modelIds = huntModels?.map(m => m.id) || []
  const { data: stationCounts } = await supabase
    .from('model_stations')
    .select('model_id')
    .in('model_id', modelIds)

  // Get mission counts for each model  
  const { data: missionCounts } = await supabase
    .from('model_missions')
    .select('model_id')
    .in('model_id', modelIds)

  // Group counts by model
  const stationCountsByModel = stationCounts?.reduce((acc, station) => {
    acc[station.model_id] = (acc[station.model_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const missionCountsByModel = missionCounts?.reduce((acc, mission) => {
    acc[mission.model_id] = (acc[mission.model_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">מודלי ציד אוצרות</h1>
          <p className="text-gray-300">
            נהל תבניות של מסעות ציד אוצרות עם עמדות ומשימות
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/admin/models/new">
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              מודל חדש
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
                placeholder="חפש מודלי ציד..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                כל המודלים
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                פעילים בלבד
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
                        {model.active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                    
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                      {model.locale === 'he' ? 'עברית' : 'English'}
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
                    <div className="text-xs text-gray-400">עמדות</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-spy-gold">
                      {missionCountsByModel[model.id] || 0}
                    </div>
                    <div className="text-xs text-gray-400">משימות</div>
                  </div>
                </div>
                
                {/* Organization */}
                <div className="text-xs text-gray-400">
                  ארגון: {(model as any).orgs?.name}
                </div>
                
                {/* Created Date */}
                <div className="text-xs text-gray-500">
                  נוצר ב-{new Date(model.created_at).toLocaleDateString('he-IL')}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link href={`/admin/models/${model.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Edit className="w-4 h-4 mr-2" />
                      ערוך
                    </Button>
                  </Link>
                  
                  <Link href={`/admin/models/${model.id}/preview`}>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  
                  <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
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
            <h3 className="text-xl font-medium text-gray-400 mb-2">אין מודלי ציד</h3>
            <p className="text-gray-500 mb-6">
              צור את המודל הראשון שלך כדי להתחיל לבנות מסעות ציד אוצרות מקצועיים
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

      {/* Quick Start Guide */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-spy-gold" />
            מדריך מהיר
          </CardTitle>
          <CardDescription className="text-gray-400">
            איך ליצור מודל ציד אוצרות משלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">צור מודל</h4>
              <p className="text-sm text-gray-400">התחל בהגדרת שם, תיאור ושפה למודל החדש</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">הוסף עמדות</h4>
              <p className="text-sm text-gray-400">צור עמדות שונות עם הוראות ופעילויות</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">צור משימות</h4>
              <p className="text-sm text-gray-400">הגדר משימות שמקשרות בין העמדות עם רמזים וסרטונים</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}