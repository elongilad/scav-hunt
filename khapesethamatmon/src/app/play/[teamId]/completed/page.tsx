'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import VideoRenderStatus from '@/components/VideoRenderStatus'
import { 
  Trophy,
  Star,
  Camera,
  Share2,
  Home,
  Clock,
  Users,
  Target,
  CheckCircle,
  Sparkles,
  Download,
  Play
} from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'

interface TeamData {
  id: string
  name: string
  score: number
  completion_time: string
  participants: string[]
  events: {
    child_name: string
    hunt_models: {
      name: string
    }
  }
}

interface TeamStats {
  totalStations: number
  completedStations: number
  totalTime: number
  rank: number
  totalTeams: number
}

interface PageProps {
  params: {
    teamId: string
  }
}

export default function CompletedPage({ params }: PageProps) {
  const [team, setTeam] = useState<TeamData | null>(null)
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFireworks, setShowFireworks] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCompletionData()
    
    // Trigger celebration animation
    setTimeout(() => {
      triggerCelebration()
    }, 500)
  }, [params.teamId])

  const loadCompletionData = async () => {
    setLoading(true)
    
    try {
      // Get team data
      const { data: teamData } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          score,
          completion_time,
          participants,
          event_id,
          events (
            child_name,
            hunt_models (name)
          )
        `)
        .eq('id', params.teamId)
        .single()

      if (!teamData) throw new Error('צוות לא נמצא')

      setTeam(teamData)

      // Get team progress and stats
      const { data: progressData } = await supabase
        .from('team_progress')
        .select('*')
        .eq('team_id', params.teamId)

      // Get total stations count
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          model_id,
          hunt_models (
            model_stations (id)
          )
        `)
        .eq('id', teamData.event_id)
        .single()

      const totalStations = (eventData as any)?.hunt_models?.model_stations?.length || 0
      const completedStations = progressData?.filter(p => p.status === 'completed').length || 0

      // Get leaderboard position
      const leaderboardResponse = await fetch(`/api/routing?action=leaderboard&eventId=${teamData.event_id}`)
      const leaderboardData = await leaderboardResponse.json()
      
      const teamRank = leaderboardData.leaderboard?.find((entry: any) => entry.team.id === params.teamId)?.rank || 0
      const totalTeams = leaderboardData.leaderboard?.length || 0

      // Calculate total time
      const totalTime = teamData.completion_time && teamData.created_at
        ? (new Date(teamData.completion_time).getTime() - new Date(teamData.created_at).getTime()) / 60000
        : 0

      setStats({
        totalStations,
        completedStations,
        totalTime: Math.round(totalTime),
        rank: teamRank,
        totalTeams
      })

    } catch (err: any) {
      console.error('Error loading completion data:', err)
    } finally {
      setLoading(false)
    }
  }

  const triggerCelebration = () => {
    setShowFireworks(true)
    
    // Confetti animation
    const duration = 3000
    const animationEnd = Date.now() + duration

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        setShowFireworks(false)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      })
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      })
    }, 250)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')} שעות`
    }
    return `${mins} דקות`
  }

  const getRankText = (rank: number, total: number) => {
    if (rank === 1) return '🥇 מקום ראשון!'
    if (rank === 2) return '🥈 מקום שני!'
    if (rank === 3) return '🥉 מקום שלישי!'
    return `מקום ${rank} מתוך ${total}`
  }

  const getScoreDescription = (score: number) => {
    if (score >= 800) return 'ביצוע מושלם! 🌟'
    if (score >= 600) return 'ביצוע מעולה! 👏'
    if (score >= 400) return 'ביצוע טוב! 👍'
    if (score >= 200) return 'ביצוע סביר 🙂'
    return 'השלמתם את הציד! 🎉'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">טוען תוצאות...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!team || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <p className="text-red-400 mb-4">שגיאה בטעינת התוצאות</p>
              <Link href={`/play/${params.teamId}`}>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  חזור
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
        {/* Celebration Header */}
        <Card className="bg-gradient-to-r from-spy-gold/20 to-yellow-500/20 border-spy-gold/30 text-white relative overflow-hidden">
          <CardContent className="p-8 text-center relative z-10">
            <div className="relative">
              <Trophy className="w-20 h-20 text-spy-gold mx-auto mb-4" />
              {showFireworks && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-24 h-24 text-yellow-400 animate-pulse" />
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-spy-gold mb-2">מזל טוב!</h1>
            <h2 className="text-xl font-semibold text-white mb-2">{team.name}</h2>
            <p className="text-gray-300 mb-4">השלמתם את הציד בהצלחה!</p>
            
            <div className="flex justify-center">
              <Badge className="bg-spy-gold text-black font-bold text-lg px-4 py-2">
                {getRankText(stats.rank, stats.totalTeams)}
              </Badge>
            </div>
          </CardContent>
          
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4">⭐</div>
            <div className="absolute top-8 right-8">🎉</div>
            <div className="absolute bottom-8 left-8">🏆</div>
            <div className="absolute bottom-4 right-4">✨</div>
          </div>
        </Card>

        {/* Final Stats */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-spy-gold" />
              התוצאות הסופיות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-spy-gold mb-2">{team.score}</div>
              <div className="text-lg text-white mb-1">נקודות</div>
              <div className="text-sm text-gray-400">{getScoreDescription(team.score)}</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Target className="w-6 h-6 text-spy-gold mx-auto mb-2" />
                <div className="font-bold text-white">{stats.completedStations}/{stats.totalStations}</div>
                <div className="text-xs text-gray-400">עמדות הושלמו</div>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Clock className="w-6 h-6 text-spy-gold mx-auto mb-2" />
                <div className="font-bold text-white">{formatTime(stats.totalTime)}</div>
                <div className="text-xs text-gray-400">זמן כולל</div>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Trophy className="w-6 h-6 text-spy-gold mx-auto mb-2" />
                <div className="font-bold text-white">#{stats.rank}</div>
                <div className="text-xs text-gray-400">דירוג</div>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Users className="w-6 h-6 text-spy-gold mx-auto mb-2" />
                <div className="font-bold text-white">{team.participants?.length || 0}</div>
                <div className="text-xs text-gray-400">משתתפים</div>
              </div>
            </div>

            {/* Completion Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">השלמה</span>
                <span className="text-white">100%</span>
              </div>
              <Progress value={100} className="h-3" />
              <div className="flex items-center justify-center mt-2">
                <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">כל העמדות הושלמו!</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>פרטי הצוות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2">חברי הצוות:</h4>
              <p className="text-gray-300">{team.participants?.join(', ') || 'לא מוגדר'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">ציד:</h4>
              <p className="text-gray-300">
                {team.events.child_name 
                  ? `ציד של ${team.events.child_name}` 
                  : team.events.hunt_models.name
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">הושלם ב:</h4>
              <p className="text-gray-300">
                {new Date(team.completion_time).toLocaleString('he-IL')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Video Status */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-spy-gold" />
              הוידאו שלכם
            </CardTitle>
            <CardDescription className="text-gray-400">
              וידאו אישי מכל הקטעים שצילמתם
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoRenderStatus 
              eventId={team.event_id}
              onComplete={(outputPath) => {
                console.log('Video completed:', outputPath)
              }}
            />
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>הישגים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">השלמת הציד</p>
                  <p className="text-sm text-gray-300">סיימתם את כל העמדות</p>
                </div>
              </div>
              
              {stats.rank <= 3 && (
                <div className="flex items-center gap-3 p-3 bg-spy-gold/20 border border-spy-gold/30 rounded-lg">
                  <Trophy className="w-6 h-6 text-spy-gold" />
                  <div>
                    <p className="font-medium text-spy-gold">
                      {stats.rank === 1 ? 'מקום ראשון!' : 
                       stats.rank === 2 ? 'מקום שני!' : 'מקום שלישי!'}
                    </p>
                    <p className="text-sm text-gray-300">ביצוע מעולה!</p>
                  </div>
                </div>
              )}
              
              {team.score >= 600 && (
                <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <Star className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-400">ביצוע מעולה</p>
                    <p className="text-sm text-gray-300">ניקוד גבוה במיוחד</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-12"
            onClick={() => navigator.share && navigator.share({
              title: `השלמנו את ציד האוצרות!`,
              text: `הצוות ${team.name} השלים את הציד עם ${team.score} נקודות במקום ה-${stats.rank}!`,
              url: window.location.href
            })}
          >
            <Share2 className="w-5 h-5 mr-2" />
            שתף את ההישג
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/play/${params.teamId}/video`}>
              <Button 
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Play className="w-4 h-4 mr-2" />
                צפה בוידאו
              </Button>
            </Link>
            
            <Link href="/play">
              <Button 
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                חזור לבית
              </Button>
            </Link>
          </div>
        </div>

        {/* Thank You Message */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-spy-gold mb-2">תודה שהשתתפתם!</h3>
            <p className="text-gray-300 text-sm">
              אנו מקווים שנהניתם מהציד ויש לכם זיכרונות נפלאים.
              הוידאו האישי שלכם יישמר כזיכרון מהיום המיוחד הזה.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}