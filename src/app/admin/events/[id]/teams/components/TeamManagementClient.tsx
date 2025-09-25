'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Users, Plus, Edit, Trash2, Eye, Settings, QrCode, MessageCircle,
  MapPin, Clock, Trophy, Activity, Target, Navigation, Zap,
  Copy, CheckCircle, AlertCircle, Calendar, UserPlus, Palette
} from 'lucide-react'
import { createTeam } from '@/server/actions/teams/createTeam'
import { updateTeam } from '@/server/actions/teams/updateTeam'
import { getTeamDetails } from '@/server/actions/teams/getTeamDetails'

interface Team {
  id: string
  name: string
  access_code: string
  color?: string
  emblem_url?: string
  max_members: number
  created_at: string
  updated_at: string
  status?: 'active' | 'inactive' | 'completed'
}

interface ExtendedTeam extends Team {
  progressPercent?: number
  completedStations?: number
  totalStations?: number
  timeElapsedSeconds?: number
  startTime?: string | null
  endTime?: string | null
  lastActivity?: string | null
  visits?: Array<{
    id: string
    stationId: string
    stationName: string
    visitedAt: string
    completed: boolean
  }>
  assignments?: Array<{
    id: string
    stationId: string
    stationName: string
    missionId: string
    missionTitle: string
  }>
}

interface Props {
  eventId: string
  initialTeams: Team[]
}

export function TeamManagementClient({ eventId, initialTeams }: Props) {
  const { t } = useLanguage()
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [selectedTeam, setSelectedTeam] = useState<ExtendedTeam | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewDetailsTeam, setViewDetailsTeam] = useState<ExtendedTeam | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Form states
  const [newTeam, setNewTeam] = useState({
    name: '',
    color: '#3B82F6',
    maxMembers: 8
  })

  const [editingTeam, setEditingTeam] = useState({
    name: '',
    color: '#3B82F6',
    maxMembers: 8
  })

  const refreshTeams = useCallback(async () => {
    try {
      const result = await getTeamDetails({ eventId })
      if (result.ok && result.teams) {
        setTeams(result.teams)
      }
    } catch (error) {
      console.error('Failed to refresh teams:', error)
    }
  }, [eventId])

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) return

    setIsLoading(true)
    try {
      const result = await createTeam({
        eventId,
        name: newTeam.name,
        color: newTeam.color,
        maxMembers: newTeam.maxMembers
      })

      if (result.ok) {
        await refreshTeams()
        setNewTeam({ name: '', color: '#3B82F6', maxMembers: 8 })
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Failed to create team:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !editingTeam.name.trim()) return

    setIsLoading(true)
    try {
      const result = await updateTeam({
        eventId,
        teamId: selectedTeam.id,
        updates: {
          name: editingTeam.name,
          color: editingTeam.color,
          maxMembers: editingTeam.maxMembers
        }
      })

      if (result.ok) {
        await refreshTeams()
        setIsEditing(false)
        setSelectedTeam(null)
      }
    } catch (error) {
      console.error('Failed to update team:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = async (team: Team) => {
    setIsLoading(true)
    try {
      const result = await getTeamDetails({ eventId, teamId: team.id })
      if (result.ok && result.team) {
        setViewDetailsTeam(result.team)
      }
    } catch (error) {
      console.error('Failed to load team details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return t('tracking.just_now', 'Just now')
    if (diffMinutes < 60) return t('tracking.minutes_ago', `${diffMinutes}m ago`)
    const diffHours = Math.floor(diffMinutes / 60)
    return t('tracking.hours_ago', `${diffHours}h ago`)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="outline" className="border-gray-500/30 text-gray-400">
            {t('tracking.not_started', 'Not Started')}
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            {t('tracking.in_progress', 'In Progress')}
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500/30 text-green-400">
            {t('tracking.completed', 'Completed')}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-spy-gold/30 text-spy-gold">
            {t('common.active', 'Active')}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{teams.length}</p>
                <p className="text-xs text-gray-400">{t('teams.total_teams', 'Total Teams')}</p>
              </div>
              <Users className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">
                  {teams.filter(t => (t as any).status === 'in_progress').length}
                </p>
                <p className="text-xs text-gray-400">{t('teams.active_teams', 'Active Teams')}</p>
              </div>
              <Activity className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">
                  {teams.filter(t => (t as any).status === 'completed').length}
                </p>
                <p className="text-xs text-gray-400">{t('teams.completed_teams', 'Completed')}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">
                  {Math.round(teams.reduce((sum, t) => sum + ((t as any).progressPercent || 0), 0) / teams.length) || 0}%
                </p>
                <p className="text-xs text-gray-400">{t('teams.avg_progress', 'Avg Progress')}</p>
              </div>
              <Trophy className="w-6 h-6 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">{t('teams.manage_teams', 'Manage Teams')}</h2>
          <p className="text-gray-400 text-sm">{t('teams.manage_description', 'Create, edit, and coordinate team activities')}</p>
        </div>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {t('teams.create_team', 'Create Team')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>{t('teams.create_new_team', 'Create New Team')}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {t('teams.create_description', 'Set up a new team for the event')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('teams.team_name', 'Team Name')}</Label>
                <Input
                  id="name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder={t('teams.team_name_placeholder', 'Enter team name')}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="color">{t('teams.team_color', 'Team Color')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color"
                    value={newTeam.color}
                    onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                    className="w-10 h-10 rounded border-2 border-white/20"
                  />
                  <Input
                    value={newTeam.color}
                    onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxMembers">{t('teams.max_members', 'Max Members')}</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="1"
                  max="50"
                  value={newTeam.maxMembers}
                  onChange={(e) => setNewTeam({ ...newTeam, maxMembers: parseInt(e.target.value) })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={isLoading || !newTeam.name.trim()}
                className="bg-spy-gold hover:bg-spy-gold/90 text-black"
              >
                {isLoading ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => {
          const extTeam = team as ExtendedTeam
          return (
            <Card key={team.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(extTeam.status)}
                        <span className="text-xs text-gray-400">
                          {t('teams.max_members', 'Max')}: {team.max_members}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Access Code */}
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t('teams.access_code', 'Access Code')}</p>
                      <p className="text-spy-gold font-mono font-bold text-lg">{team.access_code}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyAccessCode(team.access_code)}
                      className="border-spy-gold/30 text-spy-gold hover:bg-spy-gold/10"
                    >
                      {copiedCode === team.access_code ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress (if available) */}
                {extTeam.progressPercent !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{t('tracking.progress', 'Progress')}</span>
                      <span className="text-white font-medium">{extTeam.progressPercent}%</span>
                    </div>
                    <Progress value={extTeam.progressPercent} className="h-2" />
                    {extTeam.completedStations !== undefined && extTeam.totalStations !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        {extTeam.completedStations}/{extTeam.totalStations} {t('tracking.stations', 'stations')}
                      </p>
                    )}
                  </div>
                )}

                {/* Time & Activity */}
                {extTeam.timeElapsedSeconds !== undefined && extTeam.timeElapsedSeconds > 0 && (
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(extTeam.timeElapsedSeconds)}
                    </div>
                    {extTeam.lastActivity && (
                      <div>{formatRelativeTime(extTeam.lastActivity)}</div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(team)}
                    className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {t('common.view', 'View')}
                  </Button>

                  <Dialog open={isEditing && selectedTeam?.id === team.id} onOpenChange={(open) => {
                    if (!open) {
                      setIsEditing(false)
                      setSelectedTeam(null)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeam(team as ExtendedTeam)
                          setEditingTeam({
                            name: team.name,
                            color: team.color || '#3B82F6',
                            maxMembers: team.max_members
                          })
                          setIsEditing(true)
                        }}
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>{t('teams.edit_team', 'Edit Team')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">{t('teams.team_name', 'Team Name')}</Label>
                          <Input
                            id="edit-name"
                            value={editingTeam.name}
                            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-color">{t('teams.team_color', 'Team Color')}</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              id="edit-color"
                              value={editingTeam.color}
                              onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                              className="w-10 h-10 rounded border-2 border-white/20"
                            />
                            <Input
                              value={editingTeam.color}
                              onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-maxMembers">{t('teams.max_members', 'Max Members')}</Label>
                          <Input
                            id="edit-maxMembers"
                            type="number"
                            min="1"
                            max="50"
                            value={editingTeam.maxMembers}
                            onChange={(e) => setEditingTeam({ ...editingTeam, maxMembers: parseInt(e.target.value) })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsEditing(false)
                          setSelectedTeam(null)
                        }}>
                          {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                          onClick={handleUpdateTeam}
                          disabled={isLoading || !editingTeam.name.trim()}
                          className="bg-spy-gold hover:bg-spy-gold/90 text-black"
                        >
                          {isLoading ? t('common.updating', 'Updating...') : t('common.update', 'Update')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Team Details Dialog */}
      <Dialog open={!!viewDetailsTeam} onOpenChange={() => setViewDetailsTeam(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white/30"
                style={{ backgroundColor: viewDetailsTeam?.color }}
              />
              {viewDetailsTeam?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('teams.detailed_team_information', 'Detailed team information and progress')}
            </DialogDescription>
          </DialogHeader>

          {viewDetailsTeam && (
            <div className="space-y-6">
              {/* Team Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {viewDetailsTeam.progressPercent || 0}%
                  </p>
                  <p className="text-xs text-gray-400">{t('tracking.progress', 'Progress')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {viewDetailsTeam.completedStations || 0}/{viewDetailsTeam.totalStations || 0}
                  </p>
                  <p className="text-xs text-gray-400">{t('tracking.stations', 'Stations')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-spy-gold">
                    {viewDetailsTeam.timeElapsedSeconds ? formatTime(viewDetailsTeam.timeElapsedSeconds) : '0:00'}
                  </p>
                  <p className="text-xs text-gray-400">{t('teams.time_elapsed', 'Time')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-spy-gold">
                    {getStatusBadge(viewDetailsTeam.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('common.status', 'Status')}</p>
                </div>
              </div>

              {/* Recent Visits */}
              {viewDetailsTeam.visits && viewDetailsTeam.visits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-spy-gold" />
                    {t('tracking.recent_visits', 'Recent Visits')}
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewDetailsTeam.visits.slice(-10).reverse().map((visit, index) => (
                      <div key={visit.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${visit.completed ? 'bg-green-400' : 'bg-yellow-400'}`} />
                          <span className="text-white">{visit.stationName}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatRelativeTime(visit.visitedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Assignments */}
              {viewDetailsTeam.assignments && viewDetailsTeam.assignments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-spy-gold" />
                    {t('teams.assignments', 'Assignments')} ({viewDetailsTeam.assignments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {viewDetailsTeam.assignments.map((assignment) => {
                      const isCompleted = viewDetailsTeam.visits?.some(v =>
                        v.stationId === assignment.stationId && v.completed
                      )
                      return (
                        <div key={assignment.id} className="p-2 bg-white/5 rounded-lg flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{assignment.stationName}</p>
                            <p className="text-xs text-gray-400 truncate">{assignment.missionTitle}</p>
                          </div>
                          {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('teams.no_teams', 'No Teams Yet')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('teams.no_teams_description', 'Create your first team to start organizing the event')}
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('teams.create_first_team', 'Create First Team')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}