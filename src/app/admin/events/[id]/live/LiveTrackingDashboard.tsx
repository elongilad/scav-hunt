'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  MapPin,
  Clock,
  Trophy,
  Activity,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Team {
  id: string
  name: string
  access_code: string
  created_at: string
}

interface TeamProgress {
  teamId: string
  teamName: string
  currentStation: string | null
  lastActivity: string | null
  completedStations: number
  totalStations: number
  progressPercentage: number
  status: 'active' | 'completed' | 'stuck' | 'inactive'
  timeActive: number // minutes
}

interface Station {
  id: string
  station_id: string
  display_name: string
  station_type: string
}

interface Mission {
  id: string
  mission_id: string
  title: string
  to_station_id: string
}

interface Visit {
  id: string
  team_id: string
  node_type: string
  node_ref_id: string
  action_type: string
  timestamp: string
  metadata: any
}

interface LiveTrackingDashboardProps {
  eventId: string
  initialTeams: Team[]
  initialStations: Station[]
  initialMissions: Mission[]
}

export function LiveTrackingDashboard({
  eventId,
  initialTeams,
  initialStations,
  initialMissions
}: LiveTrackingDashboardProps) {
  const [teams] = useState<Team[]>(initialTeams)
  const [stations] = useState<Station[]>(initialStations)
  const [missions] = useState<Mission[]>(initialMissions)
  const [visits, setVisits] = useState<Visit[]>([])
  const [teamProgress, setTeamProgress] = useState<TeamProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const supabase = createClient()

  // Calculate team progress from visits
  const calculateTeamProgress = (visits: Visit[], teams: Team[]): TeamProgress[] => {
    return teams.map(team => {
      const teamVisits = visits.filter(v => v.team_id === team.id)
      const stationVisits = teamVisits.filter(v => v.node_type === 'station' && v.action_type === 'complete')
      const lastVisit = teamVisits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

      const completedStations = stationVisits.length
      const totalStations = stations.length
      const progressPercentage = totalStations > 0 ? (completedStations / totalStations) * 100 : 0

      // Calculate time active (from first visit to last visit)
      const firstVisit = teamVisits.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]
      const timeActive = firstVisit && lastVisit
        ? Math.round((new Date(lastVisit.timestamp).getTime() - new Date(firstVisit.timestamp).getTime()) / (1000 * 60))
        : 0

      // Determine status
      let status: TeamProgress['status'] = 'inactive'
      if (progressPercentage === 100) {
        status = 'completed'
      } else if (lastVisit) {
        const timeSinceLastActivity = new Date().getTime() - new Date(lastVisit.timestamp).getTime()
        const minutesSinceLastActivity = timeSinceLastActivity / (1000 * 60)

        if (minutesSinceLastActivity < 10) {
          status = 'active'
        } else if (minutesSinceLastActivity > 30) {
          status = 'stuck'
        } else {
          status = 'inactive'
        }
      }

      return {
        teamId: team.id,
        teamName: team.name,
        currentStation: lastVisit?.node_ref_id || null,
        lastActivity: lastVisit?.timestamp || null,
        completedStations,
        totalStations,
        progressPercentage,
        status,
        timeActive
      }
    })
  }

  // Load visits data
  const loadVisits = async () => {
    setIsLoading(true)
    try {
      const { data: visitsData } = await supabase
        .from('event_visits')
        .select('*')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(1000)

      if (visitsData) {
        setVisits(visitsData)
        setTeamProgress(calculateTeamProgress(visitsData, teams))
      }
    } catch (error) {
      console.error('Error loading visits:', error)
    } finally {
      setIsLoading(false)
      setLastUpdate(new Date())
    }
  }

  // Auto-refresh data
  useEffect(() => {
    loadVisits()

    const interval = setInterval(loadVisits, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [eventId, teams])

  // Real-time subscription to new visits
  useEffect(() => {
    const channel = supabase
      .channel(`event_visits_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_visits',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.new) {
            setVisits(prev => [payload.new as Visit, ...prev])
            // Recalculate progress with new visit
            const newVisits = [payload.new as Visit, ...visits]
            setTeamProgress(calculateTeamProgress(newVisits, teams))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, visits, teams])

  const activeTeams = teamProgress.filter(t => t.status === 'active').length
  const completedTeams = teamProgress.filter(t => t.status === 'completed').length
  const stuckTeams = teamProgress.filter(t => t.status === 'stuck').length
  const averageProgress = teamProgress.length > 0
    ? teamProgress.reduce((sum, t) => sum + t.progressPercentage, 0) / teamProgress.length
    : 0

  const getStatusColor = (status: TeamProgress['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'stuck': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: TeamProgress['status']) => {
    switch (status) {
      case 'active': return 'פעיל'
      case 'completed': return 'הושלם'
      case 'stuck': return 'תקוע'
      case 'inactive': return 'לא פעיל'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">מעקב חי</h2>
          <p className="text-gray-400">
            עדכון אחרון: {lastUpdate.toLocaleTimeString('he-IL')}
          </p>
        </div>

        <Button
          onClick={loadVisits}
          disabled={isLoading}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">{activeTeams}</p>
                <p className="text-xs text-gray-400">קבוצות פעילות</p>
              </div>
              <Activity className="w-6 h-6 text-green-400/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{completedTeams}</p>
                <p className="text-xs text-gray-400">הושלמו</p>
              </div>
              <Trophy className="w-6 h-6 text-blue-400/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-400">{stuckTeams}</p>
                <p className="text-xs text-gray-400">תקועות</p>
              </div>
              <AlertCircle className="w-6 h-6 text-red-400/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{averageProgress.toFixed(0)}%</p>
                <p className="text-xs text-gray-400">התקדמות ממוצעת</p>
              </div>
              <TrendingUp className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Progress */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-spy-gold" />
            התקדמות קבוצות ({teams.length})
          </CardTitle>
          <CardDescription className="text-gray-400">
            מעקב בזמן אמת אחר כל הקבוצות המשתתפות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamProgress
              .sort((a, b) => b.progressPercentage - a.progressPercentage)
              .map((team) => (
                <div
                  key={team.teamId}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-white">{team.teamName}</h3>
                      <Badge className={getStatusColor(team.status)}>
                        {getStatusLabel(team.status)}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-400">
                      {team.completedStations}/{team.totalStations} עמדות
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">התקדמות:</span>
                      <span className="text-white">{team.progressPercentage.toFixed(0)}%</span>
                    </div>

                    <Progress value={team.progressPercentage} className="h-2" />

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-4">
                        {team.currentStation && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>עמדה {team.currentStation}</span>
                          </div>
                        )}

                        {team.timeActive > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{team.timeActive} דק׳</span>
                          </div>
                        )}
                      </div>

                      {team.lastActivity && (
                        <span>
                          {new Date(team.lastActivity).toLocaleTimeString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {teamProgress.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">אין קבוצות פעילות</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-spy-gold" />
            פעילות אחרונה
          </CardTitle>
          <CardDescription className="text-gray-400">
            עדכונים בזמן אמת מהשטח
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {visits.slice(0, 20).map((visit) => {
              const team = teams.find(t => t.id === visit.team_id)
              const actionText = visit.action_type === 'enter' ? 'נכנס ל' :
                                visit.action_type === 'complete' ? 'השלים ב' :
                                visit.action_type === 'fail' ? 'נכשל ב' : visit.action_type

              return (
                <div key={visit.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      visit.action_type === 'complete' ? 'bg-green-400' :
                      visit.action_type === 'enter' ? 'bg-blue-400' :
                      'bg-red-400'
                    }`} />
                    <span className="text-sm text-white">
                      {team?.name || 'קבוצה לא ידועה'} {actionText} {visit.node_type} {visit.node_ref_id}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(visit.timestamp).toLocaleTimeString('he-IL')}
                  </span>
                </div>
              )
            })}

            {visits.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">אין פעילות עדיין</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}