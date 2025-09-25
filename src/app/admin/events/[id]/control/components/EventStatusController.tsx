'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Play, Pause, Square, RotateCcw, AlertTriangle, CheckCircle,
  Clock, Settings, Zap, Timer, Users
} from 'lucide-react'

interface Props {
  eventId: string
  onStatusChange: () => void
}

interface StatusAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
  confirmRequired: boolean
}

export function EventStatusController({ eventId, onStatusChange }: Props) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>('')
  const supabase = createClientComponentClient()

  const statusActions: StatusAction[] = [
    {
      id: 'start',
      label: t('control.start_event', 'Start Event'),
      icon: <Play className="w-4 h-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      description: t('control.start_description', 'Begin the scavenger hunt for all teams'),
      confirmRequired: true
    },
    {
      id: 'pause',
      label: t('control.pause_event', 'Pause Event'),
      icon: <Pause className="w-4 h-4" />,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      description: t('control.pause_description', 'Temporarily halt the event'),
      confirmRequired: true
    },
    {
      id: 'resume',
      label: t('control.resume_event', 'Resume Event'),
      icon: <Play className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: t('control.resume_description', 'Continue the paused event'),
      confirmRequired: false
    },
    {
      id: 'finish',
      label: t('control.finish_event', 'Finish Event'),
      icon: <Square className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: t('control.finish_description', 'End the event and calculate final scores'),
      confirmRequired: true
    },
    {
      id: 'reset',
      label: t('control.reset_event', 'Reset Event'),
      icon: <RotateCcw className="w-4 h-4" />,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: t('control.reset_description', 'Reset all team progress (testing only)'),
      confirmRequired: true
    },
    {
      id: 'cancel',
      label: t('control.cancel_event', 'Cancel Event'),
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-red-600 hover:bg-red-700',
      description: t('control.cancel_description', 'Permanently cancel the event'),
      confirmRequired: true
    }
  ]

  const handleStatusChange = async (actionId: string) => {
    if (!actionId) return

    const action = statusActions.find(a => a.id === actionId)
    if (!action) return

    if (action.confirmRequired) {
      const confirmed = window.confirm(
        `${t('control.confirm_action', 'Are you sure you want to')} ${action.label.toLowerCase()}?\n\n${action.description}`
      )
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      let newStatus = 'pending'
      let additionalUpdates = {}

      switch (actionId) {
        case 'start':
          newStatus = 'active'
          additionalUpdates = { start_time: new Date().toISOString() }
          break
        case 'pause':
          newStatus = 'paused'
          break
        case 'resume':
          newStatus = 'active'
          break
        case 'finish':
          newStatus = 'finished'
          additionalUpdates = { end_time: new Date().toISOString() }
          break
        case 'reset':
          newStatus = 'pending'
          // Reset team progress
          await supabase
            .from('hunt_teams')
            .update({
              status: 'waiting',
              current_station_id: null,
              start_time: null,
              finish_time: null
            })
            .eq('event_id', eventId)

          // Clear station visits
          await supabase
            .from('team_station_visits')
            .delete()
            .eq('event_id', eventId)
          break
        case 'cancel':
          newStatus = 'cancelled'
          additionalUpdates = { end_time: new Date().toISOString() }
          break
      }

      const { error } = await supabase
        .from('hunt_events')
        .update({
          status: newStatus,
          ...additionalUpdates
        })
        .eq('id', eventId)

      if (error) throw error

      // Send system notification
      if (actionId !== 'reset') {
        await supabase
          .from('team_notifications')
          .insert({
            event_id: eventId,
            notification_type: 'event_update',
            title: `Event ${action.label}`,
            message: `The event status has been changed to: ${newStatus}`,
            data: { action: actionId, timestamp: new Date().toISOString() }
          })
      }

      onStatusChange()
      setSelectedAction('')
    } catch (error) {
      console.error('Error updating event status:', error)
      alert(t('control.error_updating', 'Error updating event status'))
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    {
      id: 'emergency_pause',
      label: t('control.emergency_pause', 'Emergency Pause'),
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-red-600 hover:bg-red-700 text-white',
      action: () => handleStatusChange('pause')
    },
    {
      id: 'extend_time',
      label: t('control.extend_time', 'Extend Time'),
      icon: <Timer className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      action: () => extendEventTime()
    },
    {
      id: 'broadcast',
      label: t('control.broadcast_all', 'Broadcast to All'),
      icon: <Users className="w-4 h-4" />,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      action: () => broadcastToAll()
    }
  ]

  const extendEventTime = async () => {
    const minutes = prompt(t('control.extend_minutes', 'Extend by how many minutes?'))
    if (!minutes || isNaN(Number(minutes))) return

    try {
      const { data: event } = await supabase
        .from('hunt_events')
        .select('end_time')
        .eq('id', eventId)
        .single()

      if (event?.end_time) {
        const newEndTime = new Date(event.end_time)
        newEndTime.setMinutes(newEndTime.getMinutes() + Number(minutes))

        await supabase
          .from('hunt_events')
          .update({ end_time: newEndTime.toISOString() })
          .eq('id', eventId)

        await supabase
          .from('team_notifications')
          .insert({
            event_id: eventId,
            notification_type: 'time_warning',
            title: t('control.time_extended', 'Event Time Extended'),
            message: t('control.time_extended_message', `Event has been extended by ${minutes} minutes`),
            data: { extended_minutes: Number(minutes) }
          })

        onStatusChange()
      }
    } catch (error) {
      console.error('Error extending time:', error)
    }
  }

  const broadcastToAll = () => {
    const message = prompt(t('control.broadcast_message', 'Message to broadcast to all teams:'))
    if (!message) return

    // This would typically trigger a broadcast announcement
    // Implementation depends on the communication system
    console.log('Broadcasting:', message)
  }

  return (
    <div className="space-y-6">
      {/* Main Status Controller */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('control.event_controller', 'Event Status Controller')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('control.manage_event_status', 'Manage the overall status and flow of your event')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={t('control.select_action', 'Select an action')} />
              </SelectTrigger>
              <SelectContent>
                {statusActions.map(action => (
                  <SelectItem key={action.id} value={action.id}>
                    <div className="flex items-center gap-2">
                      {action.icon}
                      {action.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => handleStatusChange(selectedAction)}
              disabled={!selectedAction || isLoading}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-medium"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {t('control.execute', 'Execute')}
            </Button>
          </div>

          {selectedAction && (
            <div className="p-3 bg-white/5 rounded-md border border-white/10">
              <p className="text-sm text-gray-300">
                {statusActions.find(a => a.id === selectedAction)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t('control.quick_actions', 'Quick Actions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <Button
                key={action.id}
                onClick={action.action}
                className={`${action.color} flex items-center justify-center gap-2`}
                disabled={isLoading}
              >
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('control.status_history', 'Recent Status Changes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{t('control.system_ready', 'System Ready')}</span>
              </div>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <p className="text-xs text-gray-500">
              {t('control.status_history_description', 'Status changes will appear here during the event')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}