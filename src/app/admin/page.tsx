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
  Video,
  Image,
  CheckCircle
} from 'lucide-react'

export default async function AdminOverviewPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get stats for the user's organizations
  const orgIds = (orgs as any[]).map(org => org.id)

  const [
    { data: huntModels },
    { data: mediaAssets },
    { data: events }
  ] = await Promise.all([
    supabase
      .from('hunt_models')
      .select('id, name, description, active, created_at')
      .in('org_id', orgIds)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('media_assets')
      .select('id, kind, created_at')
      .in('org_id', orgIds),
    
    supabase
      .from('events')
      .select('id, status, created_at')
      .in('org_id', orgIds)
  ])

  const stats = {
    huntModels: huntModels?.length || 0,
    activeModels: huntModels?.filter(m => m.active).length || 0,
    mediaAssets: mediaAssets?.length || 0,
    videoAssets: mediaAssets?.filter(m => m.kind === 'video').length || 0,
    recentEvents: events?.length || 0,
    activeEvents: events?.filter(e => e.status === 'active').length || 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Studio</h1>
          <p className="text-gray-300">
            Manage hunt models, stations, missions and video templates
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/admin/models/new">
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              New Hunt Model
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hunt Models</CardTitle>
            <Map className="h-4 w-4 text-spy-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.huntModels}</div>
            <p className="text-xs text-gray-400">
              {stats.activeModels} פעילים
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-spy-gold" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaAssets}</div>
            <p className="text-xs text-gray-400">
              {stats.videoAssets} סרטונים
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">אירועים</CardTitle>
            <Users className="h-4 w-4 text-spy-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentEvents}</div>
            <p className="text-xs text-gray-400">
              {stats.activeEvents} פעילים
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סטטוס מערכת</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">פעיל</div>
            <p className="text-xs text-gray-400">
              כל המערכות תקינות
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Hunt Models */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>מודלי ציד אחרונים</CardTitle>
              <CardDescription className="text-gray-400">
                התבניות האחרונות שנוצרו במערכת
              </CardDescription>
            </div>
            <Link href="/admin/models">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                צפה בכל →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {huntModels && huntModels.length > 0 ? (
            <div className="space-y-4">
              {huntModels.slice(0, 5).map((model) => (
                <div
                  key={model.id}
                  className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white">{model.name}</h3>
                      <Badge 
                        variant={model.active ? "default" : "secondary"}
                        className={model.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}
                      >
                        {model.active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                    {model.description && (
                      <p className="text-gray-400 text-sm">{model.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      נוצר ב-{new Date(model.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/models/${model.id}`}>
                      <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        ערוך
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Map className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">אין מודלי ציד</h3>
              <p className="text-gray-500 mb-6">
                צור את המודל הראשון שלך כדי להתחיל
              </p>
              <Link href="/admin/models/new">
                <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  צור מודל ראשון
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/models/new">
          <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-spy-gold" />
                </div>
                <div>
                  <CardTitle className="text-lg">מודל ציד חדש</CardTitle>
                  <CardDescription className="text-gray-400">
                    צור תבנית חדשה למסע ציד אוצרות
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/media">
          <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-spy-gold" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-lg">ספריית מדיה</CardTitle>
                  <CardDescription className="text-gray-400">
                    נהל סרטונים, תמונות וקבצי אודיו
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/templates">
          <Card className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-spy-gold" />
                </div>
                <div>
                  <CardTitle className="text-lg">תבניות וידאו</CardTitle>
                  <CardDescription className="text-gray-400">
                    עצב תבניות למשימות וסרטוני בריפינג
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}