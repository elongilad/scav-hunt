'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Bell, CheckCircle, AlertTriangle, Lightbulb, Clock, Users,
  Target, Route, Shield, Gift, Settings, Filter, Trash2, X
} from 'lucide-react'

interface Props {
  eventId: string
  onNotificationRead: () => void
}

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  data: any
  is_read: boolean
  expires_at: string | null
  created_at: string
  team: { id: string; name: string } | null
}

export function NotificationPanel({ eventId, onNotificationRead }: Props) {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Load teams and notifications
  useEffect(() => {
    loadTeams()
    loadNotifications()
  }, [eventId, selectedTeamFilter, typeFilter])

  const loadTeams = async () => {
    const { data } = await supabase
      .from('hunt_teams')
      .select('id, name')
      .eq('event_id', eventId)
      .order('name')

    if (data) {
      setTeams(data)
    }
  }

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('team_notifications')
        .select(`
          *,
          team:hunt_teams(id, name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (selectedTeamFilter) {
        query = query.eq('team_id', selectedTeamFilter)
      }
      if (typeFilter) {
        query = query.eq('notification_type', typeFilter)
      }

      const { data } = await query

      if (data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('team_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        )
        onNotificationRead()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('team_notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (!error) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true }))
        )
        onNotificationRead()
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('team_notifications')
        .delete()
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-red-500 bg-red-500/10'
      case 'mission_assigned': return 'border-blue-500 bg-blue-500/10'
      case 'route_updated': return 'border-purple-500 bg-purple-500/10'
      case 'hint_available': return 'border-yellow-500 bg-yellow-500/10'
      case 'achievement': return 'border-green-500 bg-green-500/10'
      case 'time_warning': return 'border-orange-500 bg-orange-500/10'
      default: return 'border-white/20 bg-white/5'
    }
  }

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'mission_assigned': return <Target className="w-4 h-4 text-blue-400" />
      case 'route_updated': return <Route className="w-4 h-4 text-purple-400" />
      case 'hint_available': return <Lightbulb className="w-4 h-4 text-yellow-400" />
      case 'achievement': return <Gift className="w-4 h-4 text-green-400" />
      case 'time_warning': return <Clock className="w-4 h-4 text-orange-400" />
      case 'station_unlocked': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'event_update': return <Bell className="w-4 h-4 text-blue-400" />
      case 'safety': return <Shield className="w-4 h-4 text-red-400" />
      default: return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return t('communication.just_now', 'Just now')
    if (diffMins < 60) return t('communication.minutes_ago', `${diffMins} minutes ago`)
    if (diffHours < 24) return t('communication.hours_ago', `${diffHours} hours ago`)
    return date.toLocaleDateString()
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const getNotificationTypeName = (type: string) => {
    const typeMap = {
      'mission_assigned': t('notifications.mission_assigned', 'Mission Assigned'),
      'route_updated': t('notifications.route_updated', 'Route Updated'),
      'station_unlocked': t('notifications.station_unlocked', 'Station Unlocked'),
      'hint_available': t('notifications.hint_available', 'Hint Available'),
      'time_warning': t('notifications.time_warning', 'Time Warning'),
      'event_update': t('notifications.event_update', 'Event Update'),
      'emergency': t('notifications.emergency', 'Emergency'),
      'achievement': t('notifications.achievement', 'Achievement'),
      'system': t('notifications.system', 'System')
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder={t('notifications.filter_by_team', 'Filter by team')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('notifications.all_teams', 'All teams')}</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20">
              <SelectValue placeholder={t('notifications.filter_by_type', 'Filter by type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('notifications.all_types', 'All types')}</SelectItem>
              <SelectItem value="emergency">{t('notifications.emergency', 'Emergency')}</SelectItem>
              <SelectItem value="mission_assigned">{t('notifications.mission_assigned', 'Mission Assigned')}</SelectItem>
              <SelectItem value="route_updated">{t('notifications.route_updated', 'Route Updated')}</SelectItem>
              <SelectItem value="hint_available">{t('notifications.hint_available', 'Hint Available')}</SelectItem>
              <SelectItem value="achievement">{t('notifications.achievement', 'Achievement')}</SelectItem>
              <SelectItem value="time_warning">{t('notifications.time_warning', 'Time Warning')}</SelectItem>
              <SelectItem value="event_update">{t('notifications.event_update', 'Event Update')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('notifications.mark_all_read', 'Mark all read')} ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications Display */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('notifications.notifications', 'Notifications')}
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-1">
                {unreadCount} {t('notifications.unread', 'unread')}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('notifications.system_notifications', 'System and event notifications')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-gray-400 py-8">
                {t('notifications.loading', 'Loading notifications...')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {t('notifications.no_notifications', 'No notifications found')}
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${getNotificationTypeColor(notification.notification_type)} ${
                    !notification.is_read ? 'ring-2 ring-spy-gold/50' : ''
                  } ${
                    isExpired(notification.expires_at) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getNotificationTypeIcon(notification.notification_type)}
                      <span className="font-medium text-white">{notification.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {getNotificationTypeName(notification.notification_type)}
                      </Badge>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-spy-gold rounded-full" />
                      )}
                      {isExpired(notification.expires_at) && (
                        <Badge variant="secondary" className="text-xs">
                          {t('notifications.expired', 'Expired')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatNotificationTime(notification.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-2">{notification.message}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {notification.team ? (
                        <>
                          <Users className="w-3 h-3" />
                          {notification.team.name}
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" />
                          {t('notifications.all_teams', 'All teams')}
                        </>
                      )}
                    </div>

                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-spy-gold hover:text-spy-gold/80 text-xs h-6 px-2"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('notifications.mark_read', 'Mark read')}
                      </Button>
                    )}
                  </div>

                  {notification.expires_at && !isExpired(notification.expires_at) && (
                    <div className="mt-2 text-xs text-gray-400">
                      {t('notifications.expires_at', 'Expires')}: {new Date(notification.expires_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}