'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Users, Navigation, MessageCircle, AlertTriangle, MapPin,
  Clock, Play, Pause, RotateCcw, Send, Target
} from 'lucide-react'

interface Props {
  eventId: string
  stats: {
    totalTeams: number
    activeTeams: number
    completedTeams: number
  }
}

interface Team {
  id: string
  name: string
  status: string
  current_station_id: string | null
  start_time: string | null
  finish_time: string | null
  current_station?: { name: string } | null
  visits_count: number
}

export function TeamCoordinator({ eventId, stats }: Props) {
  const { t } = useLanguage()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTeams()
  }, [eventId])

  const loadTeams = async () => {
    try {
      const { data: teamsData } = await supabase
        .from('hunt_teams')
        .select(`
          id, name, status, current_station_id, start_time, finish_time,
          current_station:hunt_stations!current_station_id(name),
          visits:team_station_visits(id)
        `)
        .eq('event_id', eventId)
        .order('name')

      if (teamsData) {
        const teamsWithCounts = teamsData.map(team => ({
          ...team,
          current_station: Array.isArray(team.current_station)
            ? team.current_station[0] || null
            : team.current_station,
          visits_count: team.visits?.length || 0
        }))
        setTeams(teamsWithCounts)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }

  const executeTeamAction = async () => {
    if (!selectedTeam || !selectedAction) return

    setIsLoading(true)
    try {
      const team = teams.find(t => t.id === selectedTeam)
      if (!team) return

      switch (selectedAction) {
        case 'start':
          await supabase
            .from('hunt_teams')
            .update({
              status: 'active',
              start_time: new Date().toISOString()
            })
            .eq('id', selectedTeam)
          break

        case 'pause':
          await supabase
            .from('hunt_teams')
            .update({ status: 'paused' })
            .eq('id', selectedTeam)
          break

        case 'resume':
          await supabase
            .from('hunt_teams')
            .update({ status: 'active' })
            .eq('id', selectedTeam)
          break

        case 'finish':
          await supabase
            .from('hunt_teams')
            .update({
              status: 'finished',
              finish_time: new Date().toISOString()
            })
            .eq('id', selectedTeam)
          break

        case 'reset':
          await supabase
            .from('hunt_teams')
            .update({
              status: 'waiting',
              current_station_id: null,
              start_time: null,
              finish_time: null
            })
            .eq('id', selectedTeam)

          // Clear team visits
          await supabase
            .from('team_station_visits')
            .delete()
            .eq('team_id', selectedTeam)
          break

        case 'message':
          const message = prompt(t('team.send_message', 'Message to send to team:'))
          if (message) {
            await supabase
              .from('team_messages')
              .insert({
                event_id: eventId,
                team_id: selectedTeam,
                sender_type: 'organizer',
                message_type: 'text',
                content: message,
                is_urgent: false
              })
          }
          break

        case 'hint':
          const hint = prompt(t('team.send_hint', 'Hint to send to team:'))
          if (hint) {
            await supabase
              .from('team_messages')
              .insert({
                event_id: eventId,
                team_id: selectedTeam,
                sender_type: 'organizer',
                message_type: 'hint',
                content: hint,
                is_urgent: false
              })
          }
          break

        case 'relocate':
          // This would open a station selector - simplified for now
          alert(t('team.relocate_feature', 'Team relocation feature - would show station selector'))
          break
      }

      // Create notification for team action
      await supabase
        .from('team_notifications')
        .insert({
          event_id: eventId,
          team_id: selectedTeam,
          notification_type: 'system',
          title: t('team.action_performed', 'Action Performed'),
          message: `Team action: ${selectedAction}`,
          data: { action: selectedAction, timestamp: new Date().toISOString() }
        })

      loadTeams()
      setSelectedTeam('')
      setSelectedAction('')
    } catch (error) {
      console.error('Error executing team action:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white'
      case 'waiting': return 'bg-yellow-500 text-black'
      case 'paused': return 'bg-orange-500 text-white'
      case 'finished': return 'bg-blue-500 text-white'
      case 'inactive': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />
      case 'waiting': return <Clock className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'finished': return <Target className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const actionOptions = [
    { value: 'start', label: t('team.start_team', 'Start Team'), icon: <Play className="w-4 h-4" /> },
    { value: 'pause', label: t('team.pause_team', 'Pause Team'), icon: <Pause className="w-4 h-4" /> },
    { value: 'resume', label: t('team.resume_team', 'Resume Team'), icon: <Play className="w-4 h-4" /> },
    { value: 'finish', label: t('team.finish_team', 'Finish Team'), icon: <Target className="w-4 h-4" /> },
    { value: 'reset', label: t('team.reset_team', 'Reset Team'), icon: <RotateCcw className="w-4 h-4" /> },
    { value: 'message', label: t('team.send_message', 'Send Message'), icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'hint', label: t('team.send_hint', 'Send Hint'), icon: <Navigation className="w-4 h-4" /> },
    { value: 'relocate', label: t('team.relocate', 'Relocate Team'), icon: <MapPin className="w-4 h-4" /> }
  ]

  return (
    <div className="space-y-6">
      {/* Team Actions */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('team.coordinator', 'Team Coordinator')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('team.manage_individual_teams', 'Manage individual teams and send targeted communications')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={t('team.select_team', 'Select team')} />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(team.status)}
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={t('team.select_action', 'Select action')} />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={executeTeamAction}
              disabled={!selectedTeam || !selectedAction || isLoading}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t('team.execute', 'Execute')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview Grid */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('team.team_overview', 'Team Overview')}
            </div>
            <div className="text-sm text-gray-400">
              {stats.activeTeams}/{stats.totalTeams} {t('team.teams_active', 'active')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">{team.name}</h3>
                  <Badge className={`${getStatusColor(team.status)} border-0 flex items-center gap-1`}>
                    {getStatusIcon(team.status)}
                    <span className="capitalize">{team.status}</span>
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('team.current_station', 'Current Station')}:</span>
                    <span className="text-white">
                      {team.current_station?.name || t('team.none', 'None')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('team.stations_visited', 'Stations Visited')}:</span>
                    <span className="text-white font-medium">{team.visits_count}</span>
                  </div>

                  {team.start_time && (
                    <div className="flex items-center justify-between text-gray-400">
                      <span>{t('team.started', 'Started')}:</span>
                      <span className="text-white">
                        {new Date(team.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {team.finish_time && (
                    <div className="flex items-center justify-between text-gray-400">
                      <span>{t('team.finished', 'Finished')}:</span>
                      <span className="text-white">
                        {new Date(team.finish_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(team.id)
                      setSelectedAction('message')
                    }}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {t('team.message', 'Message')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(team.id)
                      setSelectedAction('hint')
                    }}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    {t('team.hint', 'Hint')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t('team.bulk_actions', 'Bulk Actions')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('team.apply_actions_multiple', 'Apply actions to multiple teams simultaneously')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30"
              onClick={() => {
                if (confirm(t('team.confirm_start_all', 'Start all waiting teams?'))) {
                  teams.filter(t => t.status === 'waiting').forEach(team => {
                    supabase.from('hunt_teams').update({
                      status: 'active',
                      start_time: new Date().toISOString()
                    }).eq('id', team.id)
                  })
                  setTimeout(loadTeams, 1000)
                }
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              {t('team.start_all', 'Start All')}
            </Button>

            <Button
              variant="outline"
              className="bg-yellow-600/20 border-yellow-500 text-yellow-400 hover:bg-yellow-600/30"
              onClick={() => {
                if (confirm(t('team.confirm_pause_all', 'Pause all active teams?'))) {
                  teams.filter(t => t.status === 'active').forEach(team => {
                    supabase.from('hunt_teams').update({
                      status: 'paused'
                    }).eq('id', team.id)
                  })
                  setTimeout(loadTeams, 1000)
                }
              }}
            >
              <Pause className="w-4 h-4 mr-2" />
              {t('team.pause_all', 'Pause All')}
            </Button>

            <Button
              variant="outline"
              className="bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30"
              onClick={() => {
                const message = prompt(t('team.broadcast_message', 'Message to broadcast to all teams:'))
                if (message) {
                  supabase.from('team_messages').insert({
                    event_id: eventId,
                    sender_type: 'organizer',
                    message_type: 'announcement',
                    content: message,
                    is_urgent: false
                  })
                }
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('team.broadcast', 'Broadcast')}
            </Button>

            <Button
              variant="outline"
              className="bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30"
              onClick={() => {
                if (confirm(t('team.confirm_emergency_stop', 'Emergency stop all teams?'))) {
                  teams.forEach(team => {
                    supabase.from('hunt_teams').update({
                      status: 'paused'
                    }).eq('id', team.id)
                  })
                  supabase.from('team_notifications').insert({
                    event_id: eventId,
                    notification_type: 'emergency',
                    title: t('team.emergency_stop', 'Emergency Stop'),
                    message: t('team.emergency_stop_message', 'All teams have been paused due to an emergency situation'),
                    data: { action: 'emergency_stop' }
                  })
                  setTimeout(loadTeams, 1000)
                }
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t('team.emergency_stop', 'Emergency Stop')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}