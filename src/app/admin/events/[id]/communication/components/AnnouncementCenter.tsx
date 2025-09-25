'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Megaphone, Send, Pin, Users, AlertTriangle, Calendar,
  Cloud, Shield, Lightbulb, Clock, CheckCircle
} from 'lucide-react'
import { sendAnnouncement } from '@/server/actions/communication/sendAnnouncement'

interface Props {
  eventId: string
  onAnnouncementSent: () => void
}

interface Announcement {
  id: string
  title: string
  content: string
  announcement_type: string
  is_pinned: boolean
  target_teams: string[]
  created_at: string
  author: { email: string } | null
}

export function AnnouncementCenter({ eventId, onAnnouncementSent }: Props) {
  const { t } = useLanguage()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'hint' | 'schedule_change' | 'weather' | 'safety'>('general')
  const [isPinned, setIsPinned] = useState(false)
  const [targetTeams, setTargetTeams] = useState<string[]>([])
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Load teams and announcements
  useEffect(() => {
    loadTeams()
    loadAnnouncements()
  }, [eventId])

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

  const loadAnnouncements = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('team_announcements')
        .select(`
          *
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      const { data } = await query

      if (data) {
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !content.trim()) return

    setIsSending(true)
    try {
      const result = await sendAnnouncement({
        eventId,
        title,
        content,
        announcementType,
        isPinned,
        targetTeams: targetTeams.length > 0 ? targetTeams : undefined
      })

      if (result.ok) {
        setTitle('')
        setContent('')
        setAnnouncementType('general')
        setIsPinned(false)
        setTargetTeams([])
        await loadAnnouncements()
        onAnnouncementSent()
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
    } finally {
      setIsSending(false)
    }
  }

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': case 'safety': return 'border-red-500 bg-red-500/10'
      case 'schedule_change': return 'border-orange-500 bg-orange-500/10'
      case 'weather': return 'border-blue-500 bg-blue-500/10'
      case 'hint': return 'border-yellow-500 bg-yellow-500/10'
      default: return 'border-white/20 bg-white/5'
    }
  }

  const getAnnouncementTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': case 'safety': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'schedule_change': return <Calendar className="w-4 h-4 text-orange-400" />
      case 'weather': return <Cloud className="w-4 h-4 text-blue-400" />
      case 'hint': return <Lightbulb className="w-4 h-4 text-yellow-400" />
      default: return <Megaphone className="w-4 h-4 text-gray-400" />
    }
  }

  const formatAnnouncementTime = (timestamp: string) => {
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

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!selectedTeamFilter) return true
    return announcement.target_teams.length === 0 || announcement.target_teams.includes(selectedTeamFilter)
  })

  const getTargetTeamNames = (teamIds: string[]) => {
    if (teamIds.length === 0) return t('communication.all_teams', 'All teams')
    return teamIds.map(id => teams.find(t => t.id === id)?.name || 'Unknown').join(', ')
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20">
            <SelectValue placeholder={t('communication.filter_by_team', 'Filter by team')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('communication.all_announcements', 'All announcements')}</SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Announcements Display */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {t('communication.announcements', 'Announcements')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('communication.recent_announcements', 'Recent event announcements')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-gray-400 py-8">
                {t('communication.loading_announcements', 'Loading announcements...')}
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {t('communication.no_announcements', 'No announcements yet')}
              </div>
            ) : (
              filteredAnnouncements.map(announcement => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${getAnnouncementTypeColor(announcement.announcement_type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAnnouncementTypeIcon(announcement.announcement_type)}
                      <span className="font-medium text-white">{announcement.title}</span>
                      {announcement.is_pinned && (
                        <Pin className="w-4 h-4 text-spy-gold" />
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {announcement.announcement_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatAnnouncementTime(announcement.created_at)}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3">{announcement.content}</p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {getTargetTeamNames(announcement.target_teams)}
                    </div>
                    <div>
                      {t('communication.by_author', `By: ${announcement.author?.email || 'System'}`)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcement Composer */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {t('communication.create_announcement', 'Create Announcement')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('communication.broadcast_message', 'Broadcast important information to teams')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={announcementType} onValueChange={(value: any) => setAnnouncementType(value)}>
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    {t('communication.general', 'General')}
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    {t('communication.urgent', 'Urgent')}
                  </div>
                </SelectItem>
                <SelectItem value="hint">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    {t('communication.hint', 'Hint')}
                  </div>
                </SelectItem>
                <SelectItem value="schedule_change">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    {t('communication.schedule_change', 'Schedule Change')}
                  </div>
                </SelectItem>
                <SelectItem value="weather">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    {t('communication.weather', 'Weather')}
                  </div>
                </SelectItem>
                <SelectItem value="safety">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    {t('communication.safety', 'Safety')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-white/20"
                />
                <Pin className="w-4 h-4" />
                {t('communication.pin_announcement', 'Pin announcement')}
              </label>
            </div>
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('communication.announcement_title', 'Announcement title')}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('communication.announcement_content', 'Announcement content')}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-32"
          />

          {/* Team Selection */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              {t('communication.target_teams', 'Target Teams (optional)')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {teams.map(team => (
                <label key={team.id} className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={targetTeams.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTargetTeams(prev => [...prev, team.id])
                      } else {
                        setTargetTeams(prev => prev.filter(id => id !== team.id))
                      }
                    }}
                    className="rounded border-white/20"
                  />
                  {team.name}
                </label>
              ))}
            </div>
            {targetTeams.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {t('communication.no_teams_selected', 'No teams selected - will broadcast to all teams')}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {targetTeams.length === 0
                ? t('communication.broadcasting_to_all', 'Broadcasting to all teams')
                : t('communication.broadcasting_to_selected', `Broadcasting to ${targetTeams.length} selected teams`)
              }
            </div>

            <Button
              onClick={handleSendAnnouncement}
              disabled={!title.trim() || !content.trim() || isSending}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                  {t('communication.sending', 'Sending...')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('communication.broadcast', 'Broadcast')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}