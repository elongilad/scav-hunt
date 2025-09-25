'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Users, Edit, Check, X, Video } from 'lucide-react'
import { updateMissionOverride } from '@/lib/actions/override-actions'

interface Mission {
  id: string
  version_id: string
  mission_id: string
  to_station_id: string
  title: string
  clue: any
  video_template_id: string | null
  overlay_spec: any | null
  locale: string
  snapshot_order: number
}

interface MissionOverride {
  id: string
  event_id: string
  version_id: string
  mission_id: string
  enabled_override: boolean
  override_title: string | null
  override_clue: any | null
  override_video_template_id: string | null
  created_at: string
  updated_at: string
}

interface MissionOverridesListProps {
  eventId: string
  missions: Mission[]
  overrides: MissionOverride[]
}

export function MissionOverridesList({ eventId, missions, overrides }: MissionOverridesListProps) {
  const [editingMission, setEditingMission] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedClue, setEditedClue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getOverrideForMission = (missionId: string) => {
    return overrides.find(o => o.mission_id === missionId)
  }

  const handleEditStart = (mission: Mission) => {
    const override = getOverrideForMission(mission.mission_id)
    setEditingMission(mission.mission_id)
    setEditedTitle(override?.override_title || mission.title || '')

    const clueText = override?.override_clue?.text ||
                    (typeof mission.clue === 'object' ? mission.clue?.text : mission.clue) || ''
    setEditedClue(clueText)
  }

  const handleEditCancel = () => {
    setEditingMission(null)
    setEditedTitle('')
    setEditedClue('')
  }

  const handleEditSave = async (missionId: string) => {
    try {
      setIsLoading(true)

      const result = await updateMissionOverride({
        eventId,
        missionId,
        enabled: true,
        overrideTitle: editedTitle.trim() || null,
        overrideClue: editedClue.trim() ? { text: editedClue.trim() } : null
      })

      if (result.success) {
        setEditingMission(null)
        setEditedTitle('')
        setEditedClue('')
        window.location.reload() // Refresh to show changes
      } else {
        alert(`❌ שגיאה בעדכון משימה: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating mission override:', error)
      alert('❌ שגיאה בעדכון משימה')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableOverride = async (missionId: string) => {
    try {
      setIsLoading(true)

      const result = await updateMissionOverride({
        eventId,
        missionId,
        enabled: false
      })

      if (result.success) {
        window.location.reload() // Refresh to show changes
      } else {
        alert(`❌ שגיאה בביטול התאמה: ${result.error}`)
      }
    } catch (error) {
      console.error('Error disabling override:', error)
      alert('❌ שגיאה בביטול התאמה')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-spy-gold" />
          התאמות משימות ({missions.length})
        </CardTitle>
        <CardDescription className="text-gray-400">
          התאם אישית את כותרות המשימות והרמזים לאירוע זה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {missions.map((mission) => {
            const override = getOverrideForMission(mission.mission_id)
            const isEditing = editingMission === mission.mission_id
            const isOverridden = override?.enabled_override

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isOverridden
                    ? 'bg-spy-gold/10 border-spy-gold/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-spy-gold font-bold text-xs">{mission.snapshot_order + 1}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        עמדה {mission.to_station_id}
                      </Badge>
                      {mission.video_template_id && (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                          <Video className="w-3 h-3 mr-1" />
                          וידאו
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        {mission.locale === 'he' ? 'עברית' : 'English'}
                      </Badge>
                      {isOverridden && (
                        <Badge className="text-xs bg-spy-gold/20 text-spy-gold border-spy-gold/30">
                          מותאם אישית
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(mission)}
                            disabled={isLoading}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {isOverridden && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisableOverride(mission.mission_id)}
                              disabled={isLoading}
                              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                            >
                              בטל התאמה
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">כותרת המשימה:</label>
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="כותרת המשימה"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">רמז:</label>
                        <Textarea
                          value={editedClue}
                          onChange={(e) => setEditedClue(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="הרמז שהמשתתפים יקבלו"
                          rows={2}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(mission.mission_id)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          שמור
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <X className="w-4 h-4 mr-2" />
                          בטל
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-white mb-1">
                        {isOverridden ? override.override_title : mission.title || `משימה לעמדה ${mission.to_station_id}`}
                      </h3>

                      <p className="text-sm text-gray-300">
                        יעד: עמדה {mission.to_station_id}
                      </p>

                      {(isOverridden ? override.override_clue?.text :
                        (typeof mission.clue === 'object' ? mission.clue?.text : mission.clue)) && (
                        <p className="text-sm text-gray-400 italic mt-2">
                          רמז: "{isOverridden ? override.override_clue?.text :
                                 (typeof mission.clue === 'object' ? mission.clue?.text : mission.clue)}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {missions.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">אין משימות באירוע זה</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}