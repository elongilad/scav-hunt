'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/LanguageContext'
import { Shield, AlertTriangle, Megaphone, Phone, Users, Pause } from 'lucide-react'

interface Props {
  eventId: string
}

export function EmergencyPanel({ eventId }: Props) {
  const { t } = useLanguage()
  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleEmergencyAction = async (action: string) => {
    setIsLoading(true)
    try {
      const timestamp = new Date().toISOString()

      switch (action) {
        case 'emergency_stop':
          // Pause all active teams
          await supabase
            .from('hunt_teams')
            .update({ status: 'paused' })
            .eq('event_id', eventId)
            .in('status', ['active'])

          // Pause the event
          await supabase
            .from('hunt_events')
            .update({ status: 'paused' })
            .eq('id', eventId)

          // Send emergency notification
          await supabase
            .from('team_notifications')
            .insert({
              event_id: eventId,
              notification_type: 'emergency',
              title: t('emergency.emergency_stop', 'EMERGENCY STOP'),
              message: t('emergency.emergency_stop_message', 'The event has been paused due to an emergency. Please stay where you are and await further instructions.'),
              data: { action: 'emergency_stop', timestamp }
            })
          break

        case 'broadcast_emergency':
          if (!emergencyMessage.trim()) {
            alert(t('emergency.enter_message', 'Please enter an emergency message'))
            return
          }

          await supabase
            .from('team_notifications')
            .insert({
              event_id: eventId,
              notification_type: 'emergency',
              title: t('emergency.emergency_broadcast', 'EMERGENCY BROADCAST'),
              message: emergencyMessage,
              data: { action: 'emergency_broadcast', timestamp }
            })

          await supabase
            .from('team_announcements')
            .insert({
              event_id: eventId,
              author_id: (await supabase.auth.getUser()).data.user?.id,
              title: t('emergency.emergency_broadcast', 'EMERGENCY BROADCAST'),
              content: emergencyMessage,
              announcement_type: 'safety',
              is_pinned: true,
              target_teams: [] // Broadcast to all
            })

          setEmergencyMessage('')
          break

        case 'medical_alert':
          await supabase
            .from('team_notifications')
            .insert({
              event_id: eventId,
              notification_type: 'emergency',
              title: t('emergency.medical_alert', 'MEDICAL ALERT'),
              message: t('emergency.medical_alert_message', 'A medical emergency has been reported. If you require assistance, please contact event organizers immediately.'),
              data: { action: 'medical_alert', timestamp }
            })
          break

        case 'evacuation':
          await supabase
            .from('team_notifications')
            .insert({
              event_id: eventId,
              notification_type: 'emergency',
              title: t('emergency.evacuation', 'EVACUATION ORDER'),
              message: t('emergency.evacuation_message', 'Please evacuate the area immediately and proceed to the designated assembly point. Follow organizer instructions.'),
              data: { action: 'evacuation', timestamp }
            })
          break

        case 'all_clear':
          await supabase
            .from('team_notifications')
            .insert({
              event_id: eventId,
              notification_type: 'system',
              title: t('emergency.all_clear', 'ALL CLEAR'),
              message: t('emergency.all_clear_message', 'The emergency situation has been resolved. You may resume normal activities.'),
              data: { action: 'all_clear', timestamp }
            })
          break
      }

      alert(t('emergency.action_completed', 'Emergency action completed successfully'))
    } catch (error) {
      console.error('Error executing emergency action:', error)
      alert(t('emergency.action_failed', 'Failed to execute emergency action'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Emergency Actions */}
      <Card className="bg-red-950/20 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('emergency.emergency_controls', 'Emergency Controls')}
          </CardTitle>
          <CardDescription className="text-red-300">
            {t('emergency.description', 'Critical safety controls for emergency situations')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => {
                if (confirm(t('emergency.confirm_stop', 'CONFIRM: Execute emergency stop? This will pause all teams and the event.'))) {
                  handleEmergencyAction('emergency_stop')
                }
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white h-16 text-lg font-bold"
            >
              <Pause className="w-6 h-6 mr-2" />
              {t('emergency.emergency_stop', 'EMERGENCY STOP')}
            </Button>

            <Button
              onClick={() => {
                if (confirm(t('emergency.confirm_medical', 'Send medical alert to all teams?'))) {
                  handleEmergencyAction('medical_alert')
                }
              }}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white h-16 text-lg font-bold"
            >
              <Phone className="w-6 h-6 mr-2" />
              {t('emergency.medical_alert', 'MEDICAL ALERT')}
            </Button>

            <Button
              onClick={() => {
                if (confirm(t('emergency.confirm_evacuation', 'CONFIRM: Send evacuation order to all teams?'))) {
                  handleEmergencyAction('evacuation')
                }
              }}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white h-16 text-lg font-bold"
            >
              <Users className="w-6 h-6 mr-2" />
              {t('emergency.evacuation', 'EVACUATION')}
            </Button>

            <Button
              onClick={() => {
                if (confirm(t('emergency.confirm_all_clear', 'Send all clear message to all teams?'))) {
                  handleEmergencyAction('all_clear')
                }
              }}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-bold"
            >
              <Shield className="w-6 h-6 mr-2" />
              {t('emergency.all_clear', 'ALL CLEAR')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Broadcast */}
      <Card className="bg-orange-950/20 border-orange-500/30">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {t('emergency.emergency_broadcast', 'Emergency Broadcast')}
          </CardTitle>
          <CardDescription className="text-orange-300">
            {t('emergency.broadcast_description', 'Send urgent messages to all teams immediately')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={emergencyMessage}
            onChange={(e) => setEmergencyMessage(e.target.value)}
            placeholder={t('emergency.broadcast_placeholder', 'Enter your emergency message here...')}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-24"
          />

          <div className="flex justify-between items-center">
            <p className="text-sm text-orange-300">
              {t('emergency.broadcast_note', 'This message will be sent as a high-priority notification to all teams')}
            </p>

            <Button
              onClick={() => {
                if (confirm(t('emergency.confirm_broadcast', 'Send emergency broadcast to all teams?'))) {
                  handleEmergencyAction('broadcast_emergency')
                }
              }}
              disabled={!emergencyMessage.trim() || isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {t('emergency.send_broadcast', 'SEND BROADCAST')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Safety Guidelines */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {t('emergency.safety_guidelines', 'Emergency Guidelines')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-300">
            <div className="p-3 bg-red-950/20 border-l-4 border-red-500 rounded-r">
              <h4 className="font-bold text-red-400 mb-2">
                {t('emergency.emergency_stop_title', 'Emergency Stop')}
              </h4>
              <p>{t('emergency.emergency_stop_guide', 'Use immediately if there\'s any safety threat. This pauses all teams and the entire event.')}</p>
            </div>

            <div className="p-3 bg-orange-950/20 border-l-4 border-orange-500 rounded-r">
              <h4 className="font-bold text-orange-400 mb-2">
                {t('emergency.medical_alert_title', 'Medical Alert')}
              </h4>
              <p>{t('emergency.medical_alert_guide', 'Notify all teams when medical assistance is needed. Teams should avoid the affected area.')}</p>
            </div>

            <div className="p-3 bg-purple-950/20 border-l-4 border-purple-500 rounded-r">
              <h4 className="font-bold text-purple-400 mb-2">
                {t('emergency.evacuation_title', 'Evacuation')}
              </h4>
              <p>{t('emergency.evacuation_guide', 'Use only in severe emergencies. Teams will be directed to assembly points.')}</p>
            </div>

            <div className="p-3 bg-green-950/20 border-l-4 border-green-500 rounded-r">
              <h4 className="font-bold text-green-400 mb-2">
                {t('emergency.all_clear_title', 'All Clear')}
              </h4>
              <p>{t('emergency.all_clear_guide', 'Signals that the emergency is over and normal activities can resume.')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {t('emergency.emergency_contacts', 'Emergency Contacts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-white/5 rounded border border-white/10">
              <h4 className="font-bold text-white mb-1">{t('emergency.emergency_services', 'Emergency Services')}</h4>
              <p className="text-gray-300">Emergency: 100</p>
              <p className="text-gray-300">Police: 100</p>
              <p className="text-gray-300">Medical: 101</p>
            </div>

            <div className="p-3 bg-white/5 rounded border border-white/10">
              <h4 className="font-bold text-white mb-1">{t('emergency.event_organizer', 'Event Organizer')}</h4>
              <p className="text-gray-300">Phone: [Contact Number]</p>
              <p className="text-gray-300">Radio: Channel 1</p>
            </div>

            <div className="p-3 bg-white/5 rounded border border-white/10">
              <h4 className="font-bold text-white mb-1">{t('emergency.security', 'Security')}</h4>
              <p className="text-gray-300">On-site: [Security Number]</p>
              <p className="text-gray-300">Radio: Channel 2</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}