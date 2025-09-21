import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Video, 
  Plus,
  Search,
  Clock,
  Edit,
  Eye,
  Upload,
  Film,
  Layers
} from 'lucide-react'

export default async function VideoTemplatesPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = createClient()

  // Get video templates (media assets of type video)
  const { data: templates } = await supabase
    .from('media_assets')
    .select(`
      id,
      storage_path,
      embed_url,
      duration_seconds,
      language,
      meta,
      created_at,
      orgs (name)
    `)
    .eq('kind', 'video')
    .in('org_id', orgs.map(org => org.id))
    .order('created_at', { ascending: false })

  // Get scenes count for each template
  const templateIds = templates?.map(t => t.id) || []
  const { data: scenes } = await supabase
    .from('video_template_scenes')
    .select('template_asset_id')
    .in('template_asset_id', templateIds)

  // Group scenes by template
  const scenesByTemplate = scenes?.reduce((acc, scene) => {
    acc[scene.template_asset_id] = (acc[scene.template_asset_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalTemplates = templates?.length || 0
  const templatesWithScenes = Object.keys(scenesByTemplate).length
  const totalScenes = Object.values(scenesByTemplate).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">תבניות וידאו</h1>
          <p className="text-gray-300">
            נהל תבניות וידאו עם נקודות הכנסה לקטעי משתמשים
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/admin/templates/upload">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Upload className="w-4 h-4 mr-2" />
              העלה וידאו
            </Button>
          </Link>
          
          <Link href="/admin/templates/new">
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              תבנית חדשה
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
                <p className="text-2xl font-bold text-spy-gold">{totalTemplates}</p>
                <p className="text-sm text-gray-400">תבניות וידאו</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{templatesWithScenes}</p>
                <p className="text-sm text-gray-400">עם timeline</p>
              </div>
              <Layers className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{totalScenes}</p>
                <p className="text-sm text-gray-400">סה"כ scenes</p>
              </div>
              <Film className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">
                  {templates?.filter(t => t.language === 'he').length || 0}
                </p>
                <p className="text-sm text-gray-400">בעברית</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="חפש תבניות..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                כל התבניות
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                עם timeline
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                עברית
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => {
            const scenesCount = scenesByTemplate[template.id] || 0
            const fileName = template.storage_path.split('/').pop() || 'Unknown'
            const hasTimeline = scenesCount > 0
            
            return (
              <Card key={template.id} className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg truncate">{fileName}</CardTitle>
                        {hasTimeline && (
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                            Timeline
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                          {template.language === 'he' ? 'עברית' : 'English'}
                        </Badge>
                        
                        {template.duration_seconds && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(template.duration_seconds / 60)}:{(template.duration_seconds % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400">
                        {scenesCount} scenes • {(template as any).orgs?.name}
                      </p>
                    </div>
                    
                    <div className="w-12 h-12 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-spy-gold" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Video Preview Area */}
                  <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center border border-white/10">
                    {template.embed_url ? (
                      <div className="text-center">
                        <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">תצוגה מקדימה של וידאו</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">בהעלאה...</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline Info */}
                  {hasTimeline ? (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Timeline מוגדר</span>
                      </div>
                      <p className="text-xs text-gray-300">{scenesCount} scenes מוגדרים</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-medium">Timeline לא מוגדר</span>
                      </div>
                      <p className="text-xs text-gray-300">יש להגדיר timeline לשימוש במשימות</p>
                    </div>
                  )}
                  
                  {/* Metadata */}
                  {template.meta && typeof template.meta === 'object' && (
                    <div className="text-xs text-gray-400">
                      {(template.meta as any).resolution && (
                        <span>רזולוציה: {(template.meta as any).resolution} • </span>
                      )}
                      {(template.meta as any).fps && (
                        <span>FPS: {(template.meta as any).fps}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Created Date */}
                  <div className="text-xs text-gray-500">
                    נוצר ב-{new Date(template.created_at).toLocaleDateString('he-IL')}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Link href={`/admin/templates/${template.id}/timeline`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Edit className="w-4 h-4 mr-2" />
                        {hasTimeline ? 'ערוך Timeline' : 'צור Timeline'}
                      </Button>
                    </Link>
                    
                    {template.embed_url && (
                      <Link href={`/admin/templates/${template.id}/preview`}>
                        <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="text-center py-12">
            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">אין תבניות וידאו</h3>
            <p className="text-gray-500 mb-6">
              העלה קבצי וידאו וצור תבניות עם נקודות הכנסה לקטעי משתמשים
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/admin/templates/upload">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Upload className="w-4 h-4 mr-2" />
                  העלה וידאו
                </Button>
              </Link>
              <Link href="/admin/templates/new">
                <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  תבנית חדשה
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Guide */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-spy-gold" />
            איך ליצור תבנית וידאו
          </CardTitle>
          <CardDescription className="text-gray-400">
            שלבים ליצירת תבנית וידאו מקצועית
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">העלה וידאו</h4>
              <p className="text-sm text-gray-400">העלה קובץ וידאו בסיסי שישמש כתבנית</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">הגדר Timeline</h4>
              <p className="text-sm text-gray-400">צור scenes והגדר איפה להכניס קטעי משתמשים</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-spy-gold font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">שייך למשימות</h4>
              <p className="text-sm text-gray-400">קשר את התבנית למשימות במודלי הציד</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}