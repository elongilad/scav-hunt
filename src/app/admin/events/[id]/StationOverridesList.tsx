'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, Edit, Check, X } from 'lucide-react'
import { updateStationOverride } from '@/lib/actions/override-actions'

interface Station {
  id: string
  version_id: string
  station_id: string
  display_name: string
  station_type: string
  default_activity: any
  snapshot_order: number
}

interface StationOverride {
  id: string
  event_id: string
  version_id: string
  station_id: string
  enabled_override: boolean
  override_display_name: string | null
  override_activity: any | null
  created_at: string
  updated_at: string
}

interface StationOverridesListProps {
  eventId: string
  stations: Station[]
  overrides: StationOverride[]
}

export function StationOverridesList({ eventId, stations, overrides }: StationOverridesListProps) {
  const [editingStation, setEditingStation] = useState<string | null>(null)
  const [editedName, setEditedName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getOverrideForStation = (stationId: string) => {
    return overrides.find(o => o.station_id === stationId)
  }

  const handleEditStart = (station: Station) => {
    const override = getOverrideForStation(station.station_id)
    setEditingStation(station.station_id)
    setEditedName(override?.override_display_name || station.display_name)
  }

  const handleEditCancel = () => {
    setEditingStation(null)
    setEditedName('')
  }

  const handleEditSave = async (stationId: string) => {
    try {
      setIsLoading(true)

      const result = await updateStationOverride({
        eventId,
        stationId,
        enabled: true,
        overrideDisplayName: editedName.trim() || null
      })

      if (result.success) {
        setEditingStation(null)
        setEditedName('')
        window.location.reload() // Refresh to show changes
      } else {
        alert(`❌ שגיאה בעדכון עמדה: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating station override:', error)
      alert('❌ שגיאה בעדכון עמדה')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableOverride = async (stationId: string) => {
    try {
      setIsLoading(true)

      const result = await updateStationOverride({
        eventId,
        stationId,
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
          <MapPin className="w-5 h-5 text-spy-gold" />
          התאמות עמדות ({stations.length})
        </CardTitle>
        <CardDescription className="text-gray-400">
          התאם אישית את שמות העמדות והפעילויות לאירוע זה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stations.map((station) => {
            const override = getOverrideForStation(station.station_id)
            const isEditing = editingStation === station.station_id
            const isOverridden = override?.enabled_override

            return (
              <div
                key={station.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isOverridden
                    ? 'bg-spy-gold/10 border-spy-gold/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">עמדה {station.station_id}</span>
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        {station.station_type}
                      </Badge>
                      {isOverridden && (
                        <Badge className="text-xs bg-spy-gold/20 text-spy-gold border-spy-gold/30">
                          מותאם אישית
                        </Badge>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="שם העמדה"
                          disabled={isLoading}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(station.station_id)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <h3 className="font-medium text-white">
                        {isOverridden ? override.override_display_name : station.display_name}
                      </h3>
                    )}

                    <p className="text-sm text-gray-300 mt-1">
                      {typeof station.default_activity === 'string'
                        ? station.default_activity
                        : station.default_activity?.description || 'פעילות ברירת מחדל'
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(station)}
                          disabled={isLoading}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {isOverridden && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisableOverride(station.station_id)}
                            disabled={isLoading}
                            className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                          >
                            בטל התאמה
                          </Button>
                        )}
                      </>
                    )}

                    <div className="w-8 h-8 bg-spy-gold/20 rounded-lg flex items-center justify-center">
                      <span className="text-spy-gold font-bold text-sm">{station.station_id}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {stations.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">אין עמדות באירוע זה</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}