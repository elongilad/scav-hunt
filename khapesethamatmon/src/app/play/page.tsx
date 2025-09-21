'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode,
  Users,
  Play,
  MapPin,
  Clock,
  Trophy,
  Camera,
  Smartphone,
  ArrowRight
} from 'lucide-react'

interface Team {
  id: string
  name: string
  event_id: string
  status: string
  current_station_id?: string
  score: number
}

export default function PlayerHomePage() {
  const [teamCode, setTeamCode] = useState('')
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if team ID is in URL (from QR code or direct link)
    const teamId = searchParams.get('team')
    if (teamId) {
      loadTeamById(teamId)
    }
  }, [searchParams])

  const loadTeamById = async (teamId: string) => {
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
          events (
            child_name,
            status,
            hunt_models (name)
          )
        `)
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError

      setTeam(teamData)
      // Store team ID in localStorage for future sessions
      localStorage.setItem('scavhunt_team_id', teamId)
      
    } catch (err: any) {
      setError('צוות לא נמצא או לא זמין')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamByCode = async () => {
    if (!teamCode.trim()) {
      setError('אנא הזינו קוד צוות')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Search for team by name (code)
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          event_id,
          status,
          current_station_id,
          score,
          events (
            child_name,
            status,
            hunt_models (name)
          )
        `)
        .eq('name', teamCode.trim())
        .single()

      if (teamError) throw teamError

      setTeam(teamData)
      // Store team ID in localStorage
      localStorage.setItem('scavhunt_team_id', teamData.id)
      
    } catch (err: any) {
      setError('קוד צוות לא נמצא או שגוי')
    } finally {
      setLoading(false)
    }
  }

  const startHunt = () => {
    if (team) {
      router.push(`/play/${team.id}`)
    }
  }

  const scanQRCode = () => {
    if (team) {
      router.push(`/play/${team.id}/scan`)
    }
  }

  if (team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Team Info */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-spy-gold" />
              </div>
              <CardTitle className="text-2xl">ברוכים הבאים!</CardTitle>
              <CardDescription className="text-gray-300">
                צוות: {team.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {(team as any).events?.child_name 
                    ? `ציד של ${(team as any).events.child_name}` 
                    : 'ציד האוצרות'
                  }
                </h2>
                <p className="text-gray-400 text-sm">
                  מודל: {(team as any).events?.hunt_models?.name || 'לא מוגדר'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-white/5 rounded-lg">
                  <Trophy className="w-6 h-6 text-spy-gold mx-auto mb-1" />
                  <p className="text-spy-gold font-bold">{team.score}</p>
                  <p className="text-xs text-gray-400">נקודות</p>
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg">
                  <MapPin className="w-6 h-6 text-spy-gold mx-auto mb-1" />
                  <Badge 
                    variant="outline" 
                    className={
                      team.status === 'active' ? 'border-green-500/30 text-green-400' :
                      team.status === 'completed' ? 'border-blue-500/30 text-blue-400' :
                      'border-gray-500/30 text-gray-400'
                    }
                  >
                    {team.status === 'active' ? 'פעיל' :
                     team.status === 'completed' ? 'הושלם' : 'לא פעיל'}
                  </Badge>
                </div>
              </div>

              {team.status === 'completed' ? (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                  <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="font-medium text-green-400">מזל טוב!</p>
                  <p className="text-sm text-gray-300">השלמתם את הציד בהצלחה</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={startHunt}
                    className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-12"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    התחל/המשך ציד
                  </Button>
                  
                  <Button 
                    onClick={scanQRCode}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    סרוק QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Instructions */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-lg">איך זה עובד?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">סרקו QR Code</p>
                    <p className="text-gray-400 text-xs">בכל עמדה תמצאו קוד QR לסריקה</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">קבלו משימה</p>
                    <p className="text-gray-400 text-xs">תקבלו רמזים והוראות לביצוע</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">צלמו וידאו</p>
                    <p className="text-gray-400 text-xs">תעדו את ביצוע המשימה</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-spy-gold text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">המשיכו לעמדה הבאה</p>
                    <p className="text-gray-400 text-xs">תקבלו רמז לעמדה הבאה</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Welcome Header */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-spy-gold" />
            </div>
            <CardTitle className="text-3xl mb-2">🕵️ ציד האוצרות</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              ברוכים הבאים למשחק!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Team Code Entry */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-spy-gold" />
              הזינו קוד צוות
            </CardTitle>
            <CardDescription className="text-gray-400">
              הקוד שקיבלתם מהמארגנים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamCode" className="text-white">קוד צוות</Label>
              <Input
                id="teamCode"
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="הזינו את קוד הצוות..."
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-center text-lg font-mono"
                onKeyDown={(e) => e.key === 'Enter' && loadTeamByCode()}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <Button 
              onClick={loadTeamByCode}
              disabled={loading || !teamCode.trim()}
              className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-12"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  מחפש צוות...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  התחבר לצוות
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* QR Code Alternative */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <QrCode className="w-12 h-12 text-spy-gold mx-auto" />
              <div>
                <h3 className="font-medium text-white">יש לכם QR Code?</h3>
                <p className="text-sm text-gray-400">סרקו את הקוד שקיבלתם</p>
              </div>
              <Button 
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => router.push('/play/scan')}
              >
                <Camera className="w-4 h-4 mr-2" />
                פתח מצלמה
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-lg">מה מחכה לכם?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <QrCode className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="text-sm font-medium">סריקת QR</p>
                <p className="text-xs text-gray-400">גישה מהירה לעמדות</p>
              </div>
              
              <div className="text-center">
                <Camera className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="text-sm font-medium">צילום וידאו</p>
                <p className="text-xs text-gray-400">תיעוד המשימות</p>
              </div>
              
              <div className="text-center">
                <MapPin className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="text-sm font-medium">ניווט</p>
                <p className="text-xs text-gray-400">רמזים לעמדות</p>
              </div>
              
              <div className="text-center">
                <Trophy className="w-8 h-8 text-spy-gold mx-auto mb-2" />
                <p className="text-sm font-medium">ניקוד</p>
                <p className="text-xs text-gray-400">תחרות וכיף</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <p className="text-center text-sm text-gray-400">
              צריכים עזרה? פנו למארגני האירוע
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}