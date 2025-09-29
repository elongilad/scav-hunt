'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  MapPin,
  Users,
  Clock,
  Puzzle,
  CheckCircle,
  AlertCircle,
  Trophy,
  Star,
  Navigation,
  Play,
  Loader
} from 'lucide-react'
import { TeamKeypad } from '@/components/TeamKeypad'
import { useTeamCtx } from '@/lib/teamContext'

interface Quest {
  id: string
  name: string
  status: string
}

interface Station {
  id: string
  displayName: string
  sequence: number
  estimatedDuration: number
}

interface TeamProgress {
  team_id: string
  station_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  score_earned: number
  completion_time?: string
}

export default function QuestOverviewPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const { ctx, setCtx } = useTeamCtx(eventId)

  const [quest, setQuest] = useState<Quest | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [teamProgress, setTeamProgress] = useState<TeamProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamRegistered, setTeamRegistered] = useState(false)

  useEffect(() => {
    loadQuestData()
    if (ctx) {
      setTeamRegistered(true)
      loadTeamProgress()
    }
  }, [eventId, ctx])

  const loadQuestData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}/public`)
      if (!response.ok) {
        throw new Error('Quest not found or not active')
      }

      const data = await response.json()
      setQuest(data.quest)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quest')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamProgress = async () => {
    if (!ctx) return

    try {
      const response = await fetch(`/api/events/${eventId}/teams/${ctx.teamId}/progress`)
      if (response.ok) {
        const data = await response.json()
        setTeamProgress(data.progress || [])
        setStations(data.stations || [])
      }
    } catch (err) {
      console.error('Failed to load team progress:', err)
    }
  }

  const handleTeamRegistration = async (code: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/teams/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode: code })
      })

      if (!res.ok) {
        setError('Wrong code for this quest')
        return
      }

      const data = await res.json()
      setCtx(data)
      setTeamRegistered(true)
      await loadTeamProgress()
    } catch (err) {
      setError('Failed to register team')
    }
  }

  const getStationStatus = (stationId: string) => {
    const progress = teamProgress.find(p => p.station_id === stationId)
    return progress?.status || 'not_started'
  }

  const getStationIcon = (stationId: string) => {
    const status = getStationStatus(stationId)
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <MapPin className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (stationId: string) => {
    const status = getStationStatus(stationId)
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      skipped: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      not_started: 'bg-gray-100 text-gray-600 border-gray-200'
    }

    const labels = {
      completed: 'Completed',
      in_progress: 'In Progress',
      skipped: 'Skipped',
      not_started: 'Not Started'
    }

    return (
      <Badge className={`${colors[status]} border`}>
        {labels[status]}
      </Badge>
    )
  }

  const completedStations = teamProgress.filter(p => p.status === 'completed').length
  const totalScore = teamProgress.reduce((sum, p) => sum + (p.score_earned || 0), 0)
  const progressPercentage = stations.length > 0 ? (completedStations / stations.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading quest...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Quest Not Available</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Quest Header */}
        <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Puzzle className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-blue-900">
                {quest?.name || 'Quest Adventure'}
              </CardTitle>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {quest?.status === 'active' ? 'Active' : 'Ready'}
            </Badge>
          </CardHeader>
        </Card>

        {/* Team Registration */}
        {!teamRegistered ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>Join the Quest</span>
              </CardTitle>
              <p className="text-gray-600">Enter your team code to start your adventure!</p>
            </CardHeader>
            <CardContent>
              <TeamKeypad onSubmit={handleTeamRegistration} error={error || undefined} />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Team Progress Overview */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Team Code: {ctx?.teamCode}</p>
                      <p className="text-sm text-green-600">
                        Progress: {completedStations} of {stations.length} stations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      <span className="font-bold text-lg">{totalScore}</span>
                    </div>
                    <p className="text-xs text-gray-600">points</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Station List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <span>Quest Stations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stations.length > 0 ? (
                  stations.map((station) => {
                    const status = getStationStatus(station.id)
                    const isActive = status === 'in_progress'
                    const isCompleted = status === 'completed'

                    return (
                      <div
                        key={station.id}
                        className={`p-4 border rounded-lg transition-all ${
                          isActive ? 'border-blue-300 bg-blue-50' :
                          isCompleted ? 'border-green-300 bg-green-50' :
                          'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStationIcon(station.id)}
                            <div>
                              <h4 className="font-medium">
                                {station.sequence}. {station.displayName}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{station.estimatedDuration} min</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {getStatusBadge(station.id)}

                            {status === 'not_started' && (
                              <Button
                                size="sm"
                                onClick={() => window.location.href = `/s/${eventId}/${station.id}`}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Start
                              </Button>
                            )}

                            {status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => window.location.href = `/play/${ctx?.teamId}/station/${station.id}`}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Continue
                              </Button>
                            )}

                            {status === 'completed' && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Star className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {teamProgress.find(p => p.station_id === station.id)?.score_earned || 0} pts
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Puzzle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Loading quest stations...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pb-4">
          Powered by BuildaQuest
        </div>
      </div>
    </div>
  )
}