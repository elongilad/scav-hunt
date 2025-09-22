'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin,
  Navigation,
  Target,
  Clock,
  Trophy,
  Users,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface TeamProgressData {
  team: {
    id: string
    name: string
    status: string
    score: number
    current_station_id?: string
  }
  progress: Array<{
    station_id: string
    status: string
    score_earned: number
    completion_time?: string
  }>
  currentStation?: {
    station_id: string
    display_name: string
    station_type: string
  }
  nextStation?: {
    station_id: string
    display_name: string
    station_type: string
  }
  completionPercentage: number
  estimatedTimeRemaining: number
}

interface RoutingStatusProps {
  teamId: string
  onStationChange?: (stationId: string) => void
  className?: string
}

export default function RoutingStatus({ 
  teamId, 
  onStationChange, 
  className 
}: RoutingStatusProps) {
  const [teamData, setTeamData] = useState<TeamProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchTeamProgress = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/routing?action=team-progress&teamId=${teamId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch team progress')
      }

      setTeamData(data.progress)
      setLastUpdate(new Date())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    if (teamId) {
      fetchTeamProgress()

      // Poll for updates every 30 seconds
      const interval = setInterval(fetchTeamProgress, 30000)
      return () => clearInterval(interval)
    }
  }, [teamId, fetchTeamProgress])

  const getNextStation = async () => {
    try {
      const currentStationId = teamData?.currentStation?.station_id
      const response = await fetch(
        `/api/routing?action=next-station&teamId=${teamId}${
          currentStationId ? `&currentStationId=${currentStationId}` : ''
        }`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get next station')
      }

      if (data.routeDecision.next_station_id && onStationChange) {
        onStationChange(data.routeDecision.next_station_id)
      }

      // Refresh team progress
      fetchTeamProgress()

      return data.routeDecision
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')} שעות`
    }
    return `${mins} דקות`
  }

  if (loading) {
    return (
      <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-spy-gold animate-spin" />
            <span>טוען מידע על הצוות...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchTeamProgress}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!teamData) {
    return (
      <Card className={`bg-white/10 border-white/20 text-white ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">נתוני הצוות לא נמצאו</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { team, progress, currentStation, nextStation, completionPercentage, estimatedTimeRemaining } = teamData

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Team Overview */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-spy-gold" />
              {team.name}
            </CardTitle>
            
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
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-spy-gold">{completionPercentage}%</p>
              <p className="text-sm text-gray-400">הושלם</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-spy-gold">{team.score}</p>
              <p className="text-sm text-gray-400">נקודות</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-spy-gold">
                {progress.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-400">עמדות הושלמו</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-spy-gold">
                {formatTime(estimatedTimeRemaining)}
              </p>
              <p className="text-sm text-gray-400">זמן צפוי</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">התקדמות כללית</span>
              <span className="text-white">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Current & Next Station */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Station */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-spy-gold" />
              עמדה נוכחית
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStation ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-white mb-1">
                    עמדה {currentStation.station_id}: {currentStation.display_name}
                  </h3>
                  <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                    {currentStation.station_type}
                  </Badge>
                </div>
                
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm font-medium">בעמדה כעת</p>
                  <p className="text-gray-300 text-xs">השלימו את המשימה כדי להמשיך</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">לא בעמדה כרגע</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Station */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="w-5 h-5 text-spy-gold" />
              עמדה הבאה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextStation ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-white mb-1">
                    עמדה {nextStation.station_id}: {nextStation.display_name}
                  </h3>
                  <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                    {nextStation.station_type}
                  </Badge>
                </div>
                
                <Button 
                  onClick={getNextStation}
                  className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  המשך לעמדה הבאה
                </Button>
              </div>
            ) : team.status === 'completed' ? (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 text-sm font-medium">הציד הושלם!</p>
                <p className="text-gray-300 text-xs">כל הכבוד! השלמתם את כל העמדות</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <Navigation className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">אין עמדה זמינה</p>
                <Button 
                  size="sm"
                  onClick={getNextStation}
                  variant="outline"
                  className="mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  בדוק שוב
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Stations */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-spy-gold" />
            עמדות שהושלמו ({progress.filter(p => p.status === 'completed').length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {progress
              .filter(p => p.status === 'completed')
              .sort((a, b) => new Date(b.completion_time || '').getTime() - new Date(a.completion_time || '').getTime())
              .map((station, index) => (
                <div key={station.station_id} className="flex items-center justify-between p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium text-white">עמדה {station.station_id}</p>
                      {station.completion_time && (
                        <p className="text-xs text-gray-300">
                          הושלם ב-{new Date(station.completion_time).toLocaleTimeString('he-IL')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-green-400">+{station.score_earned}</p>
                    <p className="text-xs text-gray-400">נקודות</p>
                  </div>
                </div>
              ))}
            
            {progress.filter(p => p.status === 'completed').length === 0 && (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">עדיין לא הושלמו עמדות</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Info */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">
              עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}
            </p>
            
            <Button 
              size="sm" 
              variant="ghost"
              onClick={fetchTeamProgress}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}