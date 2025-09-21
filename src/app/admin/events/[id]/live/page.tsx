import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Users,
  MapPin,
  Clock,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Activity,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function LiveEventPage({ params }: PageProps) {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = createClient()

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select(`
      id,
      child_name,
      status,
      date_start,
      participant_count,
      hunt_models (
        id,
        name,
        estimated_duration
      ),
      orgs (name)
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
      current_station_id,
      score,
      completion_time,
      created_at,
      participants,
      team_progress (
        station_id,
        status,
        start_time,
        completion_time,
        score_earned
      )
    `)
    .eq('event_id', params.id)
    .order('score', { ascending: false })

  // Get stations for the event
  const { data: stations } = await supabase
    .from('model_stations')
    .select('*')
    .eq('model_id', (event as Record<string, any>)?.hunt_models?.id)
    .order('station_id')

  // Calculate event statistics
  const totalTeams = teams?.length || 0
  const activeTeams = teams?.filter(t => t.status === 'active').length || 0
  const completedTeams = teams?.filter(t => t.status === 'completed').length || 0
  const totalStations = stations?.length || 0

  // Calculate average progress
  let totalProgress = 0
  teams?.forEach(team => {
    const progress = (team as any).team_progress || []
    const completedCount = progress.filter((p: any) => p.status === 'completed').length
    totalProgress += totalStations > 0 ? (completedCount / totalStations) * 100 : 0
  })
  const averageProgress = totalTeams > 0 ? Math.round(totalProgress / totalTeams) : 0

  // Calculate station utilization
  const stationUtilization: Record<string, number> = {}
  teams?.forEach(team => {
    if (team.current_station_id) {
      stationUtilization[team.current_station_id] = 
        (stationUtilization[team.current_station_id] || 0) + 1
    }
  })

  // Get top performing teams
  const topTeams = teams?.slice(0, 5) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href={`/dashboard/events/${params.id}`}>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                ← חזור לאירוע
              </Button>
            </Link>
            
            <Badge 
              variant={event.status === 'active' ? "default" : "secondary"}
              className={
                event.status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30 animate-pulse" :
                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }
            >
              {event.status === 'active' ? 'פעיל כעת' : 'לא פעיל'}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {event.child_name ? `ציד של ${event.child_name} - מצב חי` : 'אירוע ציד - מצב חי'}
          </h1>
          
          <div className="flex items-center gap-4 text-gray-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-spy-gold" />
              <span>{totalTeams} צוותים</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-spy-gold" />
              <span>{totalStations} עמדות</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-spy-gold" />
              <span>{(event as any).hunt_models.estimated_duration} דק׳</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <RotateCcw className="w-4 h-4 mr-2" />
            רענן
          </Button>
          
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Eye className="w-4 h-4 mr-2" />
            מסך מלא
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{activeTeams}</p>
                <p className="text-sm text-gray-400">צוותים פעילים</p>
              </div>
              <Activity className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{completedTeams}</p>
                <p className="text-sm text-gray-400">השלימו</p>
              </div>
              <CheckCircle className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{averageProgress}%</p>
                <p className="text-sm text-gray-400">התקדמות ממוצעת</p>
              </div>
              <TrendingUp className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">
                  {Object.values(stationUtilization).reduce((sum, count) => sum + count, 0)}
                </p>
                <p className="text-sm text-gray-400">בעמדות כעת</p>
              </div>
              <Target className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teams Overview */}
        <div className="space-y-6">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-spy-gold" />
                סטטוס צוותים ({totalTeams})
              </CardTitle>
              <CardDescription className="text-gray-400">
                מעקב בזמן אמת אחר התקדמות הצוותים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {teams && teams.length > 0 ? (
                  teams.map((team) => {
                    const progress = (team as any).team_progress || []
                    const completedCount = progress.filter((p: any) => p.status === 'completed').length
                    const progressPercentage = totalStations > 0 ? Math.round((completedCount / totalStations) * 100) : 0
                    const currentStation = team.current_station_id 
                      ? stations?.find(s => s.station_id === team.current_station_id)
                      : null

                    return (
                      <div key={team.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">{team.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={
                                  team.status === 'completed' ? 'border-green-500/30 text-green-400' :
                                  team.status === 'active' ? 'border-blue-500/30 text-blue-400' :
                                  'border-gray-500/30 text-gray-400'
                                }
                              >
                                {team.status === 'completed' ? 'הושלם' :
                                 team.status === 'active' ? 'פעיל' : 'לא פעיל'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-400">
                              משתתפים: {Array.isArray(team.participants) ? team.participants.join(', ') : 'לא מוגדר'}
                            </p>
                            
                            {currentStation && (
                              <p className="text-sm text-spy-gold">
                                עמדה נוכחית: {currentStation.display_name}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-spy-gold">{team.score}</p>
                            <p className="text-xs text-gray-400">נקודות</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">התקדמות</span>
                            <span className="text-white">{completedCount}/{totalStations} עמדות</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        {team.completion_time && (
                          <p className="text-xs text-green-400 mt-2">
                            הושלם ב-{new Date(team.completion_time).toLocaleString('he-IL')}
                          </p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">אין צוותים רשומים לאירוע</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Station Utilization & Leaderboard */}
        <div className="space-y-6">
          {/* Station Utilization */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-spy-gold" />
                עמדות פעילות
              </CardTitle>
              <CardDescription className="text-gray-400">
                צוותים בכל עמדה כרגע
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stations && stations.length > 0 ? (
                  stations.map((station) => {
                    const teamsAtStation = stationUtilization[station.station_id] || 0
                    const utilizationPercentage = totalTeams > 0 ? (teamsAtStation / totalTeams) * 100 : 0

                    return (
                      <div key={station.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            teamsAtStation > 0 ? 'bg-green-400' : 'bg-gray-500'
                          }`} />
                          <div>
                            <p className="font-medium text-white">עמדה {station.station_id}</p>
                            <p className="text-sm text-gray-400">{station.display_name}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-spy-gold">{teamsAtStation}</p>
                          <p className="text-xs text-gray-400">צוותים</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-gray-400 text-center py-4">אין עמדות מוגדרות</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-spy-gold" />
                לוח מובילים
              </CardTitle>
              <CardDescription className="text-gray-400">
                5 הצוותים המובילים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topTeams.map((team, index) => {
                  const progress = (team as any).team_progress || []
                  const completedCount = progress.filter((p: any) => p.status === 'completed').length

                  return (
                    <div key={team.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-spy-gold/30 text-spy-gold'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-white">{team.name}</p>
                        <p className="text-sm text-gray-400">
                          {completedCount}/{totalStations} עמדות • {team.score} נקודות
                        </p>
                      </div>
                      
                      {team.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  )
                })}
                
                {topTeams.length === 0 && (
                  <p className="text-gray-400 text-center py-4">אין נתונים להצגה</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Controls */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>בקרת אירוע</CardTitle>
          <CardDescription className="text-gray-400">
            פעולות ניהול לאירוע הפעיל
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {event.status === 'active' ? (
              <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                <Pause className="w-4 h-4 mr-2" />
                השהה אירוע
              </Button>
            ) : (
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                <Play className="w-4 h-4 mr-2" />
                התחל אירוע
              </Button>
            )}
            
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <AlertCircle className="w-4 h-4 mr-2" />
              שלח הודעה לכל הצוותים
            </Button>
            
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <RotateCcw className="w-4 h-4 mr-2" />
              איפוס אירוע
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}