'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import RoutingStatus from '@/components/RoutingStatus'
import { 
  QrCode,
  Trophy,
  MapPin,
  Clock,
  Users,
  Camera,
  Navigation,
  Target,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface TeamData {
  id: string
  name: string
  event_id: string
  status: string
  current_station_id?: string
  score: number
  participants: string[]
  events: {
    child_name: string
    status: string
    hunt_models: {
      name: string
      estimated_duration: number
    }
  }
}

interface PageProps {
  params: Promise<{
    teamId: string
  }>
}

export default function TeamDashboardPage({ params }: PageProps) {
  const { teamId } = use(params)
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTeamData()
  }, [teamId])

  const loadTeamData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          event_id,
          status,
          current_station_id,
          score,
          participants,
          events (
            child_name,
            status,
            hunt_models (
              name,
              estimated_duration
            )
          )
        `)
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError

      setTeam(teamData as any)
      
      // Store team ID in localStorage
      localStorage.setItem('scavhunt_team_id', teamId)
      
    } catch (err: any) {
      setError('שגיאה בטעינת נתוני הצוות')
    } finally {
      setLoading(false)
    }
  }

  const goToQRScanner = () => {
    router.push(`/play/${teamId}/scan`)
  }

  const goToCurrentStation = () => {
    if (team?.current_station_id) {
      router.push(`/play/${teamId}/station/${team.current_station_id}`)
    }
  }

  const handleStationChange = (stationId: string) => {
    // Update local state and navigate to new station
    if (team) {
      setTeam({ ...team, current_station_id: stationId })
    }
    router.push(`/play/${teamId}/station/${stationId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-spy-gold animate-spin mx-auto mb-4" />
              <p className="text-gray-300">טוען נתוני צוות...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <div className="text-red-400 mb-4">⚠️</div>
              <p className="text-red-400 mb-4">{error || 'צוות לא נמצא'}</p>
              <Link href="/play">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Home className="w-4 h-4 mr-2" />
                  חזור לבית
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-between items-center mb-4">
              <Link href="/play">
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
              
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
            
            <CardTitle className="text-2xl mb-2">{team.name}</CardTitle>
            <CardDescription className="text-gray-300">
              {(team.events as any)?.[0]?.child_name
                ? `ציד של ${(team.events as any)[0].child_name}`
                : (team.events as any)?.[0]?.hunt_models?.name
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Team Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-lg">
                <Trophy className="w-6 h-6 text-spy-gold mx-auto mb-1" />
                <p className="text-spy-gold font-bold text-lg">{team.score}</p>
                <p className="text-xs text-gray-400">נקודות</p>
              </div>
              
              <div className="p-3 bg-white/5 rounded-lg">
                <Users className="w-6 h-6 text-spy-gold mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{team.participants?.length || 0}</p>
                <p className="text-xs text-gray-400">משתתפים</p>
              </div>
              
              <div className="p-3 bg-white/5 rounded-lg">
                <Clock className="w-6 h-6 text-spy-gold mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{(team.events as any)?.[0]?.hunt_models?.estimated_duration}</p>
                <p className="text-xs text-gray-400">דק׳ צפוי</p>
              </div>
            </div>

            {/* Participants List */}
            {team.participants && team.participants.length > 0 && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm font-medium text-gray-300 mb-2">חברי הצוות:</p>
                <p className="text-white text-sm">{team.participants.join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={goToQRScanner}
            className="h-20 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold flex-col"
          >
            <QrCode className="w-8 h-8 mb-2" />
            סרוק QR
          </Button>
          
          <Button 
            onClick={goToCurrentStation}
            disabled={!team.current_station_id}
            variant="outline"
            className="h-20 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col disabled:opacity-50"
          >
            <MapPin className="w-8 h-8 mb-2" />
            {team.current_station_id ? 'עמדה נוכחית' : 'אין עמדה'}
          </Button>
        </div>

        {/* Hunt Completed */}
        {team.status === 'completed' && (
          <Card className="bg-green-500/20 border-green-500/30 text-white">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-400 mb-2">מזל טוב!</h3>
              <p className="text-gray-300 mb-4">השלמתם את הציד בהצלחה!</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  הוידאו האישי שלכם יהיה מוכן בקרוב
                </p>
                <Button 
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => router.push(`/play/${team.id}/video`)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  צפה בוידאו
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hunt Not Started */}
        {team.status === 'active' && !team.current_station_id && (
          <Card className="bg-blue-500/20 border-blue-500/30 text-white">
            <CardContent className="p-6 text-center">
              <Navigation className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-blue-400 mb-2">בואו נתחיל!</h3>
              <p className="text-gray-300 mb-4">סרקו QR Code של העמדה הראשונה</p>
              <Button 
                onClick={goToQRScanner}
                className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
              >
                <QrCode className="w-4 h-4 mr-2" />
                סרוק QR Code
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Progress - Only show if hunt is active */}
        {team.status === 'active' && (
          <RoutingStatus 
            teamId={team.id}
            onStationChange={handleStationChange}
          />
        )}

        {/* Event Status Notice */}
        {(team.events as any)?.[0]?.status !== 'active' && (
          <Card className="bg-yellow-500/20 border-yellow-500/30 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-yellow-400 text-sm">
                האירוע כרגע לא פעיל. אנא המתינו להודעות נוספות.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-lg">זקוקים לעזרה?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-white">כיצד להמשיך:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• סרקו QR Code בעמדה</li>
                <li>• קראו את המשימה בקפידה</li>
                <li>• צלמו וידאו קצר של הביצוע</li>
                <li>• עברו לעמדה הבאה לפי הרמז</li>
              </ul>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => window.location.href = 'tel:'}
            >
              📞 צור קשר עם המארגנים
            </Button>
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <Button 
              onClick={loadTeamData}
              variant="outline"
              size="sm"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              רענן נתונים
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}