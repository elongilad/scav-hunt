'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { updateEventPreferences } from '@/server/actions/events/updateEventPreferences'
import { updateMissionOverride } from '@/server/actions/missions/updateMissionOverride'
import { Settings, Clock, Video, Camera, User, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react'

interface Mission {
  id: string
  title?: string
  enabled: boolean
  requires_video: boolean
  requires_photo: boolean
  requires_actor: boolean
  hq_candidate: boolean
  activity_candidate: boolean
  prop_requirements: string[]
  expected_minutes?: number
  p95_minutes?: number
}

interface EventPreferences {
  allow_hq_activities: boolean
  allow_actor_interactions: boolean
  prefer_no_video_capture: boolean
  max_prep_minutes: number
}

interface Props {
  eventId: string
  initialPreferences: EventPreferences
  initialMissions: Mission[]
}

export function MissionPreferencesClient({ eventId, initialPreferences, initialMissions }: Props) {
  const [preferences, setPreferences] = useState<EventPreferences>(initialPreferences)
  const [missions, setMissions] = useState<Mission[]>(initialMissions)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const estimateTime = (mission: Mission): number => {
    return (
      (mission.requires_video ? 10 : 0) +
      (mission.requires_photo ? 3 : 0) +
      (mission.requires_actor ? 5 : 0) +
      (Array.isArray(mission.prop_requirements) ? mission.prop_requirements.length * 2 : 0)
    )
  }

  const totalPrepTime = missions
    .filter(m => m.enabled)
    .reduce((sum, m) => sum + estimateTime(m), 0)

  const isOverBudget = totalPrepTime > preferences.max_prep_minutes

  const handlePreferenceChange = async (key: keyof EventPreferences, value: boolean | number) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    // Debounced save - only save preferences, not missions
    setIsUpdating(true)
    try {
      await updateEventPreferences({
        eventId,
        preferences: { [key]: value }
      })
    } catch (error) {
      console.error('Failed to update preference:', error)
      // Revert on error
      setPreferences(preferences)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMissionToggle = async (missionId: string, field: keyof Mission, value: any) => {
    const updatedMissions = missions.map(m =>
      m.id === missionId ? { ...m, [field]: value } : m
    )
    setMissions(updatedMissions)

    try {
      await updateMissionOverride({
        eventId,
        missionId,
        overrides: { [field]: value }
      })
    } catch (error) {
      console.error('Failed to update mission:', error)
      // Revert on error
      setMissions(missions)
    }
  }

  const handlePropRequirementsChange = async (missionId: string, propsText: string) => {
    const propArray = propsText.split(',').map(p => p.trim()).filter(p => p.length > 0)

    const updatedMissions = missions.map(m =>
      m.id === missionId ? { ...m, prop_requirements: propArray } : m
    )
    setMissions(updatedMissions)

    try {
      await updateMissionOverride({
        eventId,
        missionId,
        overrides: { prop_requirements: propArray }
      })
    } catch (error) {
      console.error('Failed to update props:', error)
      setMissions(missions)
    }
  }

  const enabledMissions = missions.filter(m => m.enabled)
  const disabledMissions = missions.filter(m => !m.enabled)

  return (
    <div className="space-y-6">
      {/* Event-Level Preferences */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Event Preferences
          </CardTitle>
          <CardDescription className="text-gray-400">
            Global settings that affect all missions in this event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-white">Preparation Time Budget</Label>
              <div className="space-y-3">
                <Slider
                  value={[preferences.max_prep_minutes]}
                  onValueChange={([value]) => handlePreferenceChange('max_prep_minutes', value)}
                  max={300}
                  min={30}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>30 min</span>
                  <span className="font-medium text-white">{preferences.max_prep_minutes} min</span>
                  <span>300 min</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Allow HQ Activities</Label>
                  <p className="text-sm text-gray-400">Enable missions that require organizer participation</p>
                </div>
                <Switch
                  checked={preferences.allow_hq_activities}
                  onCheckedChange={(checked) => handlePreferenceChange('allow_hq_activities', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Allow Actor Interactions</Label>
                  <p className="text-sm text-gray-400">Enable missions requiring live actors</p>
                </div>
                <Switch
                  checked={preferences.allow_actor_interactions}
                  onCheckedChange={(checked) => handlePreferenceChange('allow_actor_interactions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Prefer No Video</Label>
                  <p className="text-sm text-gray-400">Minimize video capture requirements</p>
                </div>
                <Switch
                  checked={preferences.prefer_no_video_capture}
                  onCheckedChange={(checked) => handlePreferenceChange('prefer_no_video_capture', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prep Time Overview */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Preparation Time Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-400' : 'text-spy-gold'}`}>
                {totalPrepTime} min
              </div>
              <div className="text-sm text-gray-400">Total Required</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white">{preferences.max_prep_minutes} min</div>
              <div className="text-sm text-gray-400">Budget</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                {preferences.max_prep_minutes - totalPrepTime} min
              </div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white">Progress</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-spy-gold'}`}>
                {Math.round((totalPrepTime / preferences.max_prep_minutes) * 100)}%
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isOverBudget ? 'bg-red-900' : 'bg-gray-700'}`}>
              <div
                className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-spy-gold'}`}
                style={{ width: `${Math.min(100, (totalPrepTime / preferences.max_prep_minutes) * 100)}%` }}
              />
            </div>
            {isOverBudget && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Over budget by {totalPrepTime - preferences.max_prep_minutes} minutes
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enabled Missions */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Enabled Missions ({enabledMissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {enabledMissions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                estimatedTime={estimateTime(mission)}
                onToggle={handleMissionToggle}
                onPropChange={handlePropRequirementsChange}
                eventId={eventId}
                isEnabled={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disabled Missions */}
      {disabledMissions.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              Disabled Missions ({disabledMissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {disabledMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  estimatedTime={estimateTime(mission)}
                  onToggle={handleMissionToggle}
                  onPropChange={handlePropRequirementsChange}
                  eventId={eventId}
                  isEnabled={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MissionCardProps {
  mission: Mission
  estimatedTime: number
  onToggle: (missionId: string, field: keyof Mission, value: any) => void
  onPropChange: (missionId: string, propsText: string) => void
  eventId: string
  isEnabled: boolean
}

function MissionCard({ mission, estimatedTime, onToggle, onPropChange, eventId, isEnabled }: MissionCardProps) {
  const [propsText, setPropsText] = useState(
    Array.isArray(mission.prop_requirements) ? mission.prop_requirements.join(', ') : ''
  )

  return (
    <Card className={`${isEnabled ? 'bg-white/5' : 'bg-white/5 opacity-60'} border-white/10`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-white">{mission.title || 'Untitled Mission'}</h3>
            <p className="text-sm text-gray-400">ID: {mission.id.slice(0, 8)}...</p>
          </div>
          <Switch
            checked={mission.enabled}
            onCheckedChange={(checked) => onToggle(mission.id, 'enabled', checked)}
          />
        </div>

        <div className="text-sm text-spy-gold font-medium">
          Estimated: {estimatedTime} minutes
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${mission.requires_video ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
            onClick={() => onToggle(mission.id, 'requires_video', !mission.requires_video)}
          >
            <Video className="w-3 h-3 mr-1" />
            Video
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${mission.requires_photo ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
            onClick={() => onToggle(mission.id, 'requires_photo', !mission.requires_photo)}
          >
            <Camera className="w-3 h-3 mr-1" />
            Photo
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${mission.requires_actor ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
            onClick={() => onToggle(mission.id, 'requires_actor', !mission.requires_actor)}
          >
            <User className="w-3 h-3 mr-1" />
            Actor
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${mission.hq_candidate ? 'bg-spy-gold/20 text-spy-gold border-spy-gold/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
            onClick={() => onToggle(mission.id, 'hq_candidate', !mission.hq_candidate)}
          >
            <Briefcase className="w-3 h-3 mr-1" />
            HQ
          </Badge>
        </div>

        <div className="space-y-2">
          <Label className="text-white text-sm">Props Required (comma-separated)</Label>
          <Textarea
            value={propsText}
            onChange={(e) => setPropsText(e.target.value)}
            onBlur={() => onPropChange(mission.id, propsText)}
            placeholder="e.g., flashlight, magnifying glass, fake ID"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 text-sm"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  )
}