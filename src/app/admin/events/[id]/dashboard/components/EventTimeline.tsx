'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Clock, Play, Pause, Flag, MessageCircle, Users, MapPin,
  CheckCircle, AlertTriangle, Trophy, Navigation, Zap
} from 'lucide-react'

interface Props {
  eventId: string
}

interface TimelineEvent {
  id: string
  timestamp: string
  type: 'team_start' | 'team_finish' | 'station_visit' | 'message' | 'announcement' | 'system' | 'emergency'
  title: string
  description: string
  metadata: {
    team_name?: string
    station_name?: string
    user_name?: string
    importance?: 'low' | 'medium' | 'high' | 'critical'
  }
}

export function EventTimeline({ eventId }: Props) {
  const { t } = useLanguage()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [filter, setFilter] = useState<'all' | 'teams' | 'system' | 'messages'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTimelineEvents()
    if (isLive) {
      const interval = setInterval(loadTimelineEvents, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [eventId, isLive])

  useEffect(() => {
    if (isLive) {
      setupRealTimeSubscriptions()
    }
  }, [eventId, isLive])

  const setupRealTimeSubscriptions = () => {
    const channels: any[] = []

    // Subscribe to team updates
    const teamChannel = supabase
      .channel(`timeline_teams_${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hunt_teams', filter: `event_id=eq.${eventId}` },
        () => loadTimelineEvents()
      )
      .subscribe()

    // Subscribe to station visits
    const visitChannel = supabase
      .channel(`timeline_visits_${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_station_visits', filter: `event_id=eq.${eventId}` },
        () => loadTimelineEvents()
      )
      .subscribe()

    // Subscribe to messages
    const messageChannel = supabase
      .channel(`timeline_messages_${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `event_id=eq.${eventId}` },
        () => loadTimelineEvents()
      )
      .subscribe()

    channels.push(teamChannel, visitChannel, messageChannel)

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }

  const loadTimelineEvents = async () => {
    try {
      const timelineEvents: TimelineEvent[] = []

      // Get team events (start/finish)
      const { data: teams } = await supabase
        .from('hunt_teams')
        .select('id, name, status, start_time, finish_time')
        .eq('event_id', eventId)
        .not('start_time', 'is', null)

      if (teams) {
        teams.forEach(team => {
          if (team.start_time) {
            timelineEvents.push({
              id: `team_start_${team.id}`,
              timestamp: team.start_time,
              type: 'team_start',
              title: `${team.name} started`,
              description: `Team ${team.name} began their scavenger hunt`,
              metadata: {
                team_name: team.name,
                importance: 'medium'
              }
            })
          }

          if (team.finish_time) {
            timelineEvents.push({
              id: `team_finish_${team.id}`,
              timestamp: team.finish_time,
              type: 'team_finish',
              title: `${team.name} finished`,
              description: `Team ${team.name} completed the scavenger hunt`,
              metadata: {
                team_name: team.name,
                importance: 'high'
              }
            })
          }
        })
      }

      // Get station visits (last 50 for performance)
      const { data: visits } = await supabase
        .from('team_station_visits')
        .select(`
          id, visit_time,
          team:hunt_teams(name),
          station:hunt_stations(name)
        `)
        .eq('event_id', eventId)
        .order('visit_time', { ascending: false })
        .limit(50)

      if (visits) {
        visits.forEach(visit => {
          timelineEvents.push({
            id: `visit_${visit.id}`,
            timestamp: visit.visit_time,
            type: 'station_visit',
            title: `${Array.isArray(visit.team) ? visit.team[0]?.name : (visit.team as any)?.name} visited ${Array.isArray(visit.station) ? visit.station[0]?.name : (visit.station as any)?.name}`,
            description: `Station check-in completed`,
            metadata: {
              team_name: Array.isArray(visit.team) ? visit.team[0]?.name : (visit.team as any)?.name,
              station_name: Array.isArray(visit.station) ? visit.station[0]?.name : (visit.station as any)?.name,
              importance: 'low'
            }
          })
        })
      }

      // Get messages (last 20)
      const { data: messages } = await supabase
        .from('team_messages')
        .select(`
          id, created_at, message_type, content, is_urgent,
          team:hunt_teams(name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (messages) {
        messages.forEach(message => {
          timelineEvents.push({
            id: `message_${message.id}`,
            timestamp: message.created_at,
            type: 'message',
            title: message.message_type === 'announcement' ? 'Announcement sent' :
                   message.message_type === 'hint' ? 'Hint sent' : 'Message sent',
            description: (Array.isArray(message.team) ? message.team[0]?.name : (message.team as any)?.name) ?
              `To ${Array.isArray(message.team) ? message.team[0]?.name : (message.team as any)?.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}` :
              `Broadcast: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            metadata: {
              team_name: Array.isArray(message.team) ? message.team[0]?.name : (message.team as any)?.name,
              importance: message.is_urgent ? 'high' : 'medium'
            }
          })
        })
      }

      // Get notifications (last 10)
      const { data: notifications } = await supabase
        .from('team_notifications')
        .select('id, created_at, notification_type, title, message')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (notifications) {
        notifications.forEach(notification => {
          timelineEvents.push({
            id: `notification_${notification.id}`,
            timestamp: notification.created_at,
            type: notification.notification_type === 'emergency' ? 'emergency' : 'system',
            title: notification.title,
            description: notification.message,
            metadata: {
              importance: notification.notification_type === 'emergency' ? 'critical' : 'medium'
            }
          })
        })
      }

      // Sort by timestamp (most recent first)
      timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setEvents(timelineEvents)
    } catch (error) {
      console.error('Error loading timeline events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredEvents = () => {
    switch (filter) {
      case 'teams':
        return events.filter(e => ['team_start', 'team_finish', 'station_visit'].includes(e.type))
      case 'system':
        return events.filter(e => ['system', 'emergency'].includes(e.type))
      case 'messages':
        return events.filter(e => ['message', 'announcement'].includes(e.type))
      default:
        return events
    }
  }

  const getEventIcon = (type: string, importance?: string) => {
    switch (type) {
      case 'team_start': return <Play className="w-4 h-4 text-green-400" />
      case 'team_finish': return <Trophy className="w-4 h-4 text-blue-400" />
      case 'station_visit': return <MapPin className="w-4 h-4 text-purple-400" />
      case 'message': return <MessageCircle className="w-4 h-4 text-yellow-400" />
      case 'announcement': return <Navigation className="w-4 h-4 text-spy-gold" />
      case 'system': return <Zap className="w-4 h-4 text-blue-400" />
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getImportanceBorder = (importance?: string) => {
    switch (importance) {
      case 'critical': return 'border-red-500'
      case 'high': return 'border-orange-500'
      case 'medium': return 'border-yellow-500'
      case 'low': return 'border-gray-600'
      default: return 'border-gray-600'
    }
  }

  const getImportanceBadge = (importance?: string) => {
    switch (importance) {
      case 'critical': return <Badge variant="destructive" className="text-xs">Critical</Badge>
      case 'high': return <Badge className="bg-orange-500 text-white text-xs">High</Badge>
      case 'medium': return <Badge className="bg-yellow-500 text-black text-xs">Medium</Badge>
      default: return null
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const filteredEvents = getFilteredEvents().slice(0, 50) // Limit to 50 events for performance

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-spy-gold/30 border-t-spy-gold rounded-full animate-spin" />
            <span className="ml-2 text-gray-400">Loading event timeline...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('dashboard.event_timeline', 'Event Timeline')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('dashboard.real_time_event_activity', 'Real-time event activity and updates')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isLive ? 'default' : 'outline'}
              onClick={() => setIsLive(!isLive)}
              className="text-xs"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              {isLive ? 'Live' : 'Paused'}
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'all', label: 'All', icon: Clock },
            { key: 'teams', label: 'Teams', icon: Users },
            { key: 'messages', label: 'Messages', icon: MessageCircle },
            { key: 'system', label: 'System', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? 'default' : 'ghost'}
              onClick={() => setFilter(key as any)}
              className="text-xs"
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {t('dashboard.no_events_found', 'No events found')}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`p-3 bg-white/5 rounded-lg border-l-2 ${getImportanceBorder(event.metadata.importance)} transition-all hover:bg-white/10`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type, event.metadata.importance)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {getImportanceBadge(event.metadata.importance)}
                        <span className="text-xs text-gray-400">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Metadata tags */}
                    {(event.metadata.team_name || event.metadata.station_name) && (
                      <div className="flex items-center gap-2 text-xs">
                        {event.metadata.team_name && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <Users className="w-2 h-2 mr-1" />
                            {event.metadata.team_name}
                          </Badge>
                        )}
                        {event.metadata.station_name && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <MapPin className="w-2 h-2 mr-1" />
                            {event.metadata.station_name}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress indicator for timeline */}
                {index < filteredEvents.length - 1 && (
                  <div className="ml-2 mt-3 w-px h-4 bg-white/20" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline Stats */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
            <div>
              <div className="text-sm font-bold text-green-400">
                {events.filter(e => e.type === 'team_start').length}
              </div>
              <div className="text-gray-400">Teams Started</div>
            </div>
            <div>
              <div className="text-sm font-bold text-blue-400">
                {events.filter(e => e.type === 'team_finish').length}
              </div>
              <div className="text-gray-400">Teams Finished</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-400">
                {events.filter(e => e.type === 'station_visit').length}
              </div>
              <div className="text-gray-400">Station Visits</div>
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-400">
                {events.filter(e => e.type === 'message').length}
              </div>
              <div className="text-gray-400">Messages</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}