import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ExportClient from './ExportClient'
import { 
  Download,
  QrCode,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Package
} from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EventExportPage({ params }: PageProps) {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = createClient()

  // Get event details with teams and stations
  const { data: event } = await supabase
    .from('events')
    .select(`
      id,
      child_name,
      date_start,
      status,
      orgs (name),
      hunt_models (
        id,
        name,
        model_stations (
          station_id,
          display_name,
          station_type,
          location_hint
        )
      )
    `)
    .eq('id', params.id)
    .in('org_id', orgs.map(org => org.id))
    .single()

  if (!event) {
    notFound()
  }

  // Get teams for this event
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      status,
      participants
    `)
    .eq('event_id', params.id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href={`/dashboard/events/${event.id}`}>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                חזור לאירוע
              </Button>
            </Link>
            
            <Badge 
              variant="outline"
              className={
                event.status === 'active' ? 'border-green-500/30 text-green-400' :
                event.status === 'ready' ? 'border-blue-500/30 text-blue-400' :
                event.status === 'completed' ? 'border-gray-500/30 text-gray-400' :
                'border-yellow-500/30 text-yellow-400'
              }
            >
              {event.status === 'active' && 'פעיל'}
              {event.status === 'ready' && 'מוכן'}
              {event.status === 'completed' && 'הושלם'}
              {event.status === 'draft' && 'טיוטה'}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            <Download className="w-8 h-8 text-spy-gold inline mr-3" />
            ייצוא אירוע
          </h1>
          
          <p className="text-gray-300">
            {event.child_name ? `ציד של ${event.child_name}` : 'אירוע ללא שם'}
          </p>
        </div>
      </div>

      {/* Event Overview */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>פרטי האירוע</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Calendar className="w-8 h-8 text-spy-gold mx-auto mb-2" />
              <p className="font-bold text-white">{new Date(event.date_start).toLocaleDateString('he-IL')}</p>
              <p className="text-sm text-gray-400">תאריך</p>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <MapPin className="w-8 h-8 text-spy-gold mx-auto mb-2" />
              <p className="font-bold text-white">{(event as any).hunt_models.model_stations.length}</p>
              <p className="text-sm text-gray-400">עמדות</p>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Users className="w-8 h-8 text-spy-gold mx-auto mb-2" />
              <p className="font-bold text-white">{teams?.length || 0}</p>
              <p className="text-sm text-gray-400">צוותים</p>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Package className="w-8 h-8 text-spy-gold mx-auto mb-2" />
              <p className="font-bold text-white">{(event as any).hunt_models.name}</p>
              <p className="text-sm text-gray-400">מודל ציד</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station QR Codes Preview */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-spy-gold" />
            קודי QR לעמדות
          </CardTitle>
          <CardDescription className="text-gray-400">
            קודי QR להדפסה והצבה בעמדות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(event as any).hunt_models.model_stations.map((station: any) => (
              <div key={station.station_id} className="p-3 bg-white/5 rounded-lg text-center">
                <QrCode className="w-6 h-6 text-spy-gold mx-auto mb-2" />
                <p className="font-medium text-white text-sm">{station.station_id}</p>
                <p className="text-xs text-gray-400 truncate">{station.display_name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Interface */}
      <ExportClient 
        eventData={{
          id: event.id,
          name: event.child_name || 'אירוע',
          child_name: event.child_name,
          date_start: event.date_start,
          status: event.status,
          hunt_models: (event as any).hunt_models,
          teams: teams || []
        }}
      />
      
      {/* Instructions */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-lg">הוראות שימוש</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-spy-gold text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">בחרו אפשרויות ייצוא</p>
                <p className="text-gray-400 text-xs">סמנו את הפריטים שברצונכם לכלול בקובץ</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-spy-gold text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">יצרו את הקובץ</p>
                <p className="text-gray-400 text-xs">לחצו על "יצור והורד PDF" וחכו לסיום</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-spy-gold text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">הדפיסו והכינו</p>
                <p className="text-gray-400 text-xs">הדפיסו את הקובץ והציבו קודי QR לפי ההוראות</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}