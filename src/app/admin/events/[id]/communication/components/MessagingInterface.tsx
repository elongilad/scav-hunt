'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Send, MessageCircle, Users, AlertTriangle, Image, Lightbulb,
  Clock, CheckCircle, Reply, MoreHorizontal, Filter
} from 'lucide-react'
import { sendMessage } from '@/server/actions/communication/sendMessage'
import { getMessages, markMessageAsRead } from '@/server/actions/communication/getMessages'

interface Props {
  eventId: string
  onMessageSent: () => void
}

interface Message {
  id: string
  content: string
  message_type: string
  sender_type: string
  is_urgent: boolean
  is_read: boolean
  created_at: string
  sender: { id: string; email: string } | null
  team: { id: string; name: string } | null
  replies: { count: number }[]
}

export function MessagingInterface({ eventId, onMessageSent }: Props) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [messageType, setMessageType] = useState<'text' | 'announcement' | 'hint' | 'emergency'>('text')
  const [messageContent, setMessageContent] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Load teams
  useEffect(() => {
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

    loadTeams()
  }, [eventId])

  // Load messages
  useEffect(() => {
    loadMessages()
  }, [eventId, filter])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      const result = await getMessages({
        eventId,
        teamId: selectedTeam || undefined,
        messageType: filter === 'all' ? undefined : filter as any,
        limit: 50
      })

      if (result.ok && result.messages) {
        setMessages(result.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return

    setIsSending(true)
    try {
      const result = await sendMessage({
        eventId,
        teamId: selectedTeam || undefined,
        messageType,
        content: messageContent,
        isUrgent: isUrgent || messageType === 'emergency'
      })

      if (result.ok) {
        setMessageContent('')
        setIsUrgent(false)
        setMessageType('text')
        await loadMessages()
        onMessageSent()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead({ messageId })
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      )
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-red-500 bg-red-500/10'
      case 'announcement': return 'border-blue-500 bg-blue-500/10'
      case 'hint': return 'border-yellow-500 bg-yellow-500/10'
      default: return 'border-white/20 bg-white/5'
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'announcement': return <MessageCircle className="w-4 h-4 text-blue-400" />
      case 'hint': return <Lightbulb className="w-4 h-4 text-yellow-400" />
      case 'image': return <Image className="w-4 h-4 text-green-400" />
      default: return <MessageCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const formatMessageTime = (timestamp: string) => {
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20">
            <SelectValue placeholder={t('communication.select_team', 'Select team')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('communication.all_teams', 'All teams')}</SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20">
            <Filter className="w-4 h-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('communication.all_messages', 'All messages')}</SelectItem>
            <SelectItem value="text">{t('communication.text_messages', 'Text messages')}</SelectItem>
            <SelectItem value="announcement">{t('communication.announcements', 'Announcements')}</SelectItem>
            <SelectItem value="hint">{t('communication.hints', 'Hints')}</SelectItem>
            <SelectItem value="emergency">{t('communication.emergency', 'Emergency')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Display */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('communication.message_thread', 'Message Thread')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {selectedTeam
              ? t('communication.team_conversation', `Conversation with ${teams.find(t => t.id === selectedTeam)?.name}`)
              : t('communication.all_conversations', 'All team conversations')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-gray-400 py-8">
                {t('communication.loading_messages', 'Loading messages...')}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {t('communication.no_messages', 'No messages yet')}
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border ${getMessageTypeColor(message.message_type)} ${
                    !message.is_read ? 'ring-2 ring-spy-gold/50' : ''
                  }`}
                  onClick={() => !message.is_read && handleMarkAsRead(message.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMessageTypeIcon(message.message_type)}
                      <span className="text-sm font-medium text-white">
                        {message.sender?.email || t('communication.system', 'System')}
                      </span>
                      {message.team && (
                        <Badge variant="outline" className="text-xs">
                          {message.team.name}
                        </Badge>
                      )}
                      {message.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          {t('communication.urgent', 'Urgent')}
                        </Badge>
                      )}
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-spy-gold rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatMessageTime(message.created_at)}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-2">{message.content}</p>

                  {message.replies[0]?.count > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                      <Reply className="w-3 h-3" />
                      {t('communication.replies_count', `${message.replies[0].count} replies`)}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t('communication.send_message', 'Send Message')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {t('communication.text_message', 'Text Message')}
                  </div>
                </SelectItem>
                <SelectItem value="announcement">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    {t('communication.announcement', 'Announcement')}
                  </div>
                </SelectItem>
                <SelectItem value="hint">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    {t('communication.hint', 'Hint')}
                  </div>
                </SelectItem>
                <SelectItem value="emergency">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    {t('communication.emergency', 'Emergency')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {messageType !== 'emergency' && (
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded border-white/20"
                />
                {t('communication.mark_urgent', 'Mark as urgent')}
              </label>
            )}
          </div>

          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={t('communication.message_placeholder', 'Type your message here...')}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-24"
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedTeam
                ? t('communication.sending_to_team', `Sending to: ${teams.find(t => t.id === selectedTeam)?.name}`)
                : t('communication.sending_to_all', 'Sending to: All teams')
              }
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
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
                  {t('communication.send', 'Send')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}