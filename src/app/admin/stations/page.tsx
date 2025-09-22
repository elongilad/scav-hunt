import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  MapPin, 
  Search,
  Filter,
  Eye,
  Edit,
  Plus
} from 'lucide-react'

export default async function StationsOverviewPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get all stations across all hunt models for user's organizations
  const { data: stations } = await supabase
    .from('model_stations')
    .select(`
      id,
      display_name,
      type,
      default_activity,
      created_at,
      model_id,
      hunt_models!inner (
        name,
        org_id,
        orgs (name)
      )
    `)
    .in('hunt_models.org_id', orgs.map(org => org.id))
    .order('created_at', { ascending: false })

  // Group stations by type for stats
  const stationsByType = stations?.reduce((acc, station) => {
    const type = station.type || 'other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalStations = stations?.length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">עמדות</h1>
          <p className="text-gray-300">
            כל העמדות במודלי הציד שלך
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
                <p className="text-2xl font-bold text-spy-gold">{totalStations}</p>
                <p className="text-sm text-gray-400">סה"כ עמדות</p>
              </div>
              <MapPin className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{Object.keys(stationsByType).length}</p>
                <p className="text-sm text-gray-400">סוגי עמדות</p>
              </div>
              <Filter className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stationsByType['qr'] || 0}</p>
                <p className="text-sm text-gray-400">עמדות QR</p>
              </div>
              <MapPin className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{stationsByType['puzzle'] || 0}</p>
                <p className="text-sm text-gray-400">חידות</p>
              </div>
              <MapPin className="w-8 h-8 text-spy-gold/60" />
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
                placeholder="חפש עמדות..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                כל הסוגים
              </Button>
              {Object.entries(stationsByType).map(([type, count]) => (
                <Button 
                  key={type}
                  variant="outline" 
                  size="sm" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {type} ({count})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stations List */}
      {stations && stations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stations.map((station) => (
            <Card key={`${station.model_id}-${station.id}`} className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{station.display_name}</CardTitle>
                      {station.type && (
                        <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                          {station.type}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-2">
                      ID: {station.id}
                    </p>
                    
                    <p className="text-sm text-gray-300">
                      מודל: {(station as any).hunt_models.name}
                    </p>
                  </div>
                  
                  <div className="w-10 h-10 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-spy-gold" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Activity Description */}
                {station.default_activity && (
                  <div>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {typeof station.default_activity === 'object' && station.default_activity.description
                        ? station.default_activity.description
                        : 'פעילות מותאמת'
                      }
                    </p>
                  </div>
                )}
                
                {/* Duration */}
                {station.default_activity?.estimated_duration_minutes && (
                  <div className="text-xs text-gray-400">
                    משך זמן משוער: {station.default_activity.estimated_duration_minutes} דקות
                  </div>
                )}
                
                {/* Organization */}
                <div className="text-xs text-gray-400">
                  ארגון: {(station as any).hunt_models.orgs?.name}
                </div>
                
                {/* Created Date */}
                <div className="text-xs text-gray-500">
                  נוצר ב-{new Date(station.created_at).toLocaleDateString('he-IL')}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link href={`/admin/models/${station.model_id}/stations/${station.id}/edit`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Edit className="w-4 h-4 mr-2" />
                      ערוך
                    </Button>
                  </Link>
                  
                  <Link href={`/admin/models/${station.model_id}`}>
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
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">אין עמדות</h3>
            <p className="text-gray-500 mb-6">
              צור מודל ציד ראשון כדי להתחיל להוסיף עמדות
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

      {/* Station Types Overview */}
      {Object.keys(stationsByType).length > 0 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>פילוח לפי סוגי עמדות</CardTitle>
            <CardDescription className="text-gray-400">
              התפלגות העמדות לפי סוגים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stationsByType).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-spy-gold mb-1">{count}</div>
                  <div className="text-sm text-gray-400 capitalize">{type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}