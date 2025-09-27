import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Calendar, 
  Clock,
  Users,
  MapPin,
  Video,
  Edit,
  Play,
  Download,
  QrCode,
  FileText,
  Gift,
  Settings,
  Eye,
  Share2
} from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EventDetailsPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select(`
      id,
      child_name,
      child_age,
      date_start,
      date_end,
      status,
      participant_count,
      duration_minutes,
      location,
      special_notes,
      meta,
      created_at,
      model_id,
      orgs (name),
      hunt_models (
        id,
        name,
        description,
        estimated_duration,
        max_participants,
        min_age,
        max_age
      )
    `)
    .eq('id', id)
    .in('org_id', (orgs as any[]).map(org => org.id))
    .single()

  if (!event) {
    notFound()
  }

  // Get model stations and missions
  const { data: stations } = await supabase
    .from('model_stations')
    .select(`
      id,
      station_id,
      display_name,
      station_type,
      activity_description,
      props_needed
    `)
    .eq('model_id', event.model_id)
    .order('station_id')

  const { data: missions } = await supabase
    .from('model_missions')
    .select(`
      id,
      title,
      clue,
      video_template_id,
      locale,
      active,
      to_station_id,
      model_stations!inner (
        display_name
      )
    `)
    .eq('model_id', event.model_id)
    .eq('active', true)
    .order('to_station_id')

  // Calculate event status and timing
  const now = new Date()
  const eventStart = new Date(event.date_start)
  const eventEnd = new Date(event.date_end)
  
  const isUpcoming = eventStart > now
  const isActive = eventStart <= now && eventEnd >= now
  const isCompleted = eventEnd < now
  
  const timeUntilStart = eventStart.getTime() - now.getTime()
  const daysUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard/events">
              <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                ← חזור לאירועים
              </Button>
            </Link>
            
            <Badge 
              variant={event.status === 'active' ? "default" : "secondary"}
              className={
                event.status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                event.status === 'ready' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                event.status === 'completed' ? "bg-gray-500/20 text-gray-400 border-gray-500/30" :
                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }
            >
              {event.status === 'active' && 'פעיל'}
              {event.status === 'ready' && 'מוכן'}
              {event.status === 'completed' && 'הושלם'}
              {event.status === 'draft' && 'טיוטה'}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {event.child_name ? `ציד של ${event.child_name}` : 'אירוע ללא שם'}
          </h1>
          
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-spy-gold" />
              <span>{eventStart.toLocaleDateString('he-IL')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-spy-gold" />
              <span>{eventStart.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-spy-gold" />
              <span>{event.participant_count} משתתפים</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {event.status === 'draft' && (
            <>
              <Link href={`/dashboard/events/${id}/edit`}>
                <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                  <Edit className="w-4 h-4 mr-2" />
                  ערוך
                </Button>
              </Link>
              
              <Link href={`/dashboard/events/${id}/setup`}>
                <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                  <Settings className="w-4 h-4 mr-2" />
                  הגדר עמדות
                </Button>
              </Link>
            </>
          )}
          
          <Link href={`/dashboard/events/${id}/media`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Video className="w-4 h-4 mr-2" />
              מדיה ותוכן
            </Button>
          </Link>
          
          {event.status === 'ready' && (
            <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold">
              <Play className="w-4 h-4 mr-2" />
              התחל אירוע
            </Button>
          )}
          
          <Link href={`/dashboard/events/${id}/export`}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" />
              ייצוא וQR
            </Button>
          </Link>
          
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Share2 className="w-4 h-4 mr-2" />
            שתף
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {isUpcoming && daysUntilStart > 0 && (
        <Card className="bg-blue-100 border-blue-300 text-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-blue-600">
                  האירוע יתחיל בעוד {daysUntilStart} ימים
                </p>
                <p className="text-sm text-gray-600">
                  וודא שהכנת את כל העמדות והאביזרים הנדרשים
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-spy-gold" />
                פרטי האירוע
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 text-sm">שם הילד:</span>
                    <p className="text-gray-900 font-medium">{event.child_name}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">גיל:</span>
                    <p className="text-gray-900">{event.child_age} שנים</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">מספר משתתפים:</span>
                    <p className="text-gray-900">{event.participant_count} ילדים</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">סוג אירוע:</span>
                    <p className="text-gray-900">
                      {event.meta?.birthday_theme ? 'יום הולדת' : event.meta?.custom_theme || 'אירוע רגיל'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 text-sm">תאריך ושעה:</span>
                    <p className="text-gray-900">
                      {eventStart.toLocaleDateString('he-IL')} בשעה {eventStart.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">משך צפוי:</span>
                    <p className="text-gray-900">{event.duration_minutes} דקות</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">מיקום:</span>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm">ארגון:</span>
                    <p className="text-gray-900">{(event as any).orgs.name}</p>
                  </div>
                </div>
              </div>
              
              {event.special_notes && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-gray-600 text-sm">הערות מיוחדות:</span>
                  <p className="text-gray-900 mt-1">{event.special_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hunt Model */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-spy-gold" />
                  מודל הציד
                </CardTitle>
                
                <Link href={`/admin/models/${event.model_id}`}>
                  <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    צפה במודל
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {(event as any).hunt_models.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {(event as any).hunt_models.description}
                  </p>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  <Badge variant="outline" className="border-gray-200 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {(event as any).hunt_models.estimated_duration} דק׳
                  </Badge>
                  <Badge variant="outline" className="border-gray-200 text-gray-600">
                    <Users className="w-3 h-3 mr-1" />
                    עד {(event as any).hunt_models.max_participants}
                  </Badge>
                  <Badge variant="outline" className="border-gray-200 text-gray-600">
                    גיל {(event as any).hunt_models.min_age}-{(event as any).hunt_models.max_age}
                  </Badge>
                  <Badge variant="outline" className="border-gray-200 text-gray-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {stations?.length || 0} עמדות
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stations */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-spy-gold" />
                עמדות הציד ({stations?.length || 0})
              </CardTitle>
              <CardDescription className="text-gray-600">
                הכן את העמדות הבאות לפני תחילת האירוע
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stations && stations.length > 0 ? (
                <div className="space-y-4">
                  {stations.map((station) => (
                    <div key={station.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              עמדה {station.station_id}: {station.display_name}
                            </h3>
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              {station.station_type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {station.activity_description}
                          </p>
                          
                          {station.props_needed && station.props_needed.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-600">אביזרים נדרשים:</span>
                              <ul className="text-xs text-gray-600 mt-1">
                                {station.props_needed.map((prop: string, index: number) => (
                                  <li key={index}>• {prop}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="w-8 h-8 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                          <span className="text-spy-gold font-bold text-sm">{station.station_id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">אין עמדות מוגדרות למודל זה</p>
              )}
            </CardContent>
          </Card>

          {/* Missions */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-spy-gold" />
                משימות ({missions?.length || 0})
              </CardTitle>
              <CardDescription className="text-gray-600">
                רצף המשימות שהמשתתפים יקבלו במהלך הציד
              </CardDescription>
            </CardHeader>
            <CardContent>
              {missions && missions.length > 0 ? (
                <div className="space-y-4">
                  {missions.map((mission, index) => (
                    <div key={mission.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center">
                          <span className="text-spy-gold font-bold text-xs">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {mission.title || `משימה לעמדה ${(mission as any).model_stations.display_name}`}
                            </h3>
                            {mission.video_template_id && (
                              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                                <Video className="w-3 h-3 mr-1" />
                                וידאו
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              {mission.locale === 'he' ? 'עברית' : 'English'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            יעד: {(mission as any).model_stations.display_name}
                          </p>
                          
                          {mission.clue && typeof mission.clue === 'object' && mission.clue.text && (
                            <p className="text-sm text-gray-600 italic mt-2">
                              רמז: "{mission.clue.text}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">אין משימות מוגדרות למודל זה</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <CardTitle className="text-lg">פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                <QrCode className="w-4 h-4 mr-2" />
                הורד QR Codes
              </Button>
              
              <Button variant="outline" className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                מדריך הפעלה
              </Button>
              
              <Button variant="outline" className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" />
                רשימת אביזרים
              </Button>
              
              <Button variant="outline" className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                <Settings className="w-4 h-4 mr-2" />
                הגדרות מתקדמות
              </Button>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <CardTitle className="text-lg">ציר זמן</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-spy-gold rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">נוצר</p>
                    <p className="text-xs text-gray-600">
                      {new Date(event.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.status !== 'draft' ? 'bg-spy-gold' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">הוכן להפעלה</p>
                    <p className="text-xs text-gray-600">
                      {event.status !== 'draft' ? 'הושלם' : 'עדיין לא'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isActive ? 'bg-green-500' : isUpcoming ? 'bg-gray-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">התחלת האירוע</p>
                    <p className="text-xs text-gray-600">
                      {eventStart.toLocaleDateString('he-IL')} {eventStart.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isCompleted ? 'bg-spy-gold' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">סיום האירוע</p>
                    <p className="text-xs text-gray-600">
                      {eventEnd.toLocaleDateString('he-IL')} {eventEnd.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader>
              <CardTitle className="text-lg">פרטי יצירת קשר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">מארגן:</p>
                <p className="text-gray-900">{user.email}</p>
                
                <p className="text-gray-600 mt-4">ארגון:</p>
                <p className="text-gray-900">{(event as any).orgs.name}</p>
                
                {event.special_notes && (
                  <>
                    <p className="text-gray-600 mt-4">הערות:</p>
                    <p className="text-gray-900 text-xs">{event.special_notes}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}