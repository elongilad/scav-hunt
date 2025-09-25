'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  MessageSquare, Send, Bell, Megaphone, Users, Settings,
  Volume2, VolumeX, AlertTriangle, Clock, CheckCircle,
  MessageCircle, Radio, Shield
} from 'lucide-react'
import { MessagingInterface } from './MessagingInterface'
import { AnnouncementCenter } from './AnnouncementCenter'
import { NotificationPanel } from './NotificationPanel'

interface Props {
  eventId: string
}

export function CommunicationHubClient({ eventId }: Props) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('messages')
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0,
    announcements: 0
  })
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const supabase = createClientComponentClient()

  // Setup real-time subscriptions
  useEffect(() => {
    const channels: any[] = []

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('team_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (soundEnabled && payload.new.is_urgent) {
            playNotificationSound()
          }
          updateUnreadCounts()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'team_messages', filter: `event_id=eq.${eventId}` },
        () => {
          updateUnreadCounts()
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    // Subscribe to new notifications
    const notificationChannel = supabase
      .channel('team_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_notifications', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (soundEnabled) {
            if (payload.new.notification_type === 'emergency') {
              playUrgentSound()
            } else {
              playNotificationSound()
            }
          }
          updateUnreadCounts()
        }
      )
      .subscribe()

    // Subscribe to new announcements
    const announcementChannel = supabase
      .channel('team_announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_announcements', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (soundEnabled && (payload.new.announcement_type === 'urgent' || payload.new.announcement_type === 'safety')) {
            playUrgentSound()
          } else if (soundEnabled) {
            playNotificationSound()
          }
          updateUnreadCounts()
        }
      )
      .subscribe()

    channels.push(messageChannel, notificationChannel, announcementChannel)

    // Load initial unread counts
    updateUnreadCounts()

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [eventId, soundEnabled])

  const updateUnreadCounts = async () => {
    try {
      // Get unread message count
      const { count: messageCount } = await supabase
        .from('team_messages')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('is_read', false)

      // Get unread notification count
      const { count: notificationCount } = await supabase
        .from('team_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('is_read', false)

      // Get recent announcement count (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { count: announcementCount } = await supabase
        .from('team_announcements')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .gte('created_at', yesterday.toISOString())

      setUnreadCounts({
        messages: messageCount || 0,
        notifications: notificationCount || 0,
        announcements: announcementCount || 0
      })
    } catch (error) {
      console.error('Error updating unread counts:', error)
    }
  }

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {}) // Ignore autoplay restrictions
  }

  const playUrgentSound = () => {
    const audio = new Audio('/sounds/urgent.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {}) // Ignore autoplay restrictions
  }

  const connectionStatusColor = isRealtimeConnected ? 'text-green-400' : 'text-red-400'
  const connectionStatusText = isRealtimeConnected
    ? t('communication.connected', 'Connected')
    : t('communication.disconnected', 'Disconnected')

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`text-sm font-medium ${connectionStatusColor}`}>
                  {connectionStatusText}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {t('communication.real_time', 'Real-time updates')}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-gray-400 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="ml-2">
                  {soundEnabled ? t('communication.sound_on', 'Sound On') : t('communication.sound_off', 'Sound Off')}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
          <TabsTrigger value="messages" className="relative">
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('communication.messages', 'Messages')}
            {unreadCounts.messages > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {unreadCounts.messages}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="announcements" className="relative">
            <Megaphone className="w-4 h-4 mr-2" />
            {t('communication.announcements', 'Announcements')}
            {unreadCounts.announcements > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {unreadCounts.announcements}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="notifications" className="relative">
            <Bell className="w-4 h-4 mr-2" />
            {t('communication.notifications', 'Notifications')}
            {unreadCounts.notifications > 0 && (
              <Badge variant="outline" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center border-spy-gold text-spy-gold">
                {unreadCounts.notifications}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <MessagingInterface
            eventId={eventId}
            onMessageSent={updateUnreadCounts}
          />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <AnnouncementCenter
            eventId={eventId}
            onAnnouncementSent={updateUnreadCounts}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationPanel
            eventId={eventId}
            onNotificationRead={updateUnreadCounts}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}