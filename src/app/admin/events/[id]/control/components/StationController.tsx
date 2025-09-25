'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, Users, Clock, Settings, AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  eventId: string
  stats: { totalStations: number; activeStations: number }
}

interface Station {
  id: string
  name: string
  is_active: boolean
  current_teams: number
  total_visits: number
  average_time: number
}

export function StationController({ eventId, stats }: Props) {
  const { t } = useLanguage()
  const [stations, setStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadStations()
  }, [eventId])

  const loadStations = async () => {
    try {
      const { data: stationsData } = await supabase
        .from('hunt_stations')
        .select(`
          id, name, is_active,
          visits:team_station_visits!station_id(team_id, visit_time, leave_time)
        `)
        .eq('event_id', eventId)
        .order('name')

      if (stationsData) {
        const stationsWithStats = stationsData.map(station => {
          const visits = station.visits || []
          const currentTeams = visits.filter((v: any) => !v.leave_time).length
          const totalVisits = visits.length
          const averageTime = visits.length > 0
            ? visits.reduce((acc: number, visit: any) => {
                if (visit.leave_time && visit.visit_time) {
                  const duration = new Date(visit.leave_time).getTime() - new Date(visit.visit_time).getTime()
                  return acc + duration
                }
                return acc
              }, 0) / visits.length / 60000
            : 0

          return {
            id: station.id,
            name: station.name,
            is_active: station.is_active,
            current_teams: currentTeams,
            total_visits: totalVisits,
            average_time: Math.round(averageTime)
          }
        })
        setStations(stationsWithStats)
      }
    } catch (error) {
      console.error('Error loading stations:', error)
    }
  }

  const toggleStationActive = async (stationId: string, isActive: boolean) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('hunt_stations')
        .update({ is_active: isActive })
        .eq('id', stationId)

      if (error) throw error

      // Create notification for station status change
      const station = stations.find(s => s.id === stationId)
      if (station) {
        await supabase
          .from('team_notifications')
          .insert({
            event_id: eventId,
            notification_type: 'system',
            title: `Station ${isActive ? 'Activated' : 'Deactivated'}`,
            message: `${station.name} has been ${isActive ? 'activated' : 'deactivated'}`,
            data: { station_id: stationId, action: isActive ? 'activate' : 'deactivate' }
          })
      }

      loadStations()
    } catch (error) {
      console.error('Error updating station status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Station Management */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('stations.station_controller', 'Station Controller')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('stations.manage_stations', 'Monitor and control station availability and status')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map(station => (
              <div key={station.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">{station.name}</h3>
                  <Switch
                    checked={station.is_active}
                    onCheckedChange={(checked) => toggleStationActive(station.id, checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('stations.current_teams', 'Current Teams')}:</span>
                    <Badge variant="outline" className="text-white border-white/20">
                      <Users className="w-3 h-3 mr-1" />
                      {station.current_teams}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('stations.total_visits', 'Total Visits')}:</span>
                    <span className="text-white font-medium">{station.total_visits}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('stations.avg_time', 'Avg Time')}:</span>
                    <div className="flex items-center gap-1 text-white">
                      <Clock className="w-3 h-3" />
                      {station.average_time}m
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>{t('stations.status', 'Status')}:</span>
                    <Badge className={station.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                      {station.is_active ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />{t('stations.active', 'Active')}</>
                      ) : (
                        <><AlertTriangle className="w-3 h-3 mr-1" />{t('stations.inactive', 'Inactive')}</>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Station Actions */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('stations.bulk_actions', 'Bulk Actions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30"
              onClick={() => {
                if (confirm(t('stations.confirm_activate_all', 'Activate all stations?'))) {
                  stations.forEach(station => {
                    supabase.from('hunt_stations').update({ is_active: true }).eq('id', station.id)
                  })
                  setTimeout(loadStations, 1000)
                }
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('stations.activate_all', 'Activate All')}
            </Button>

            <Button
              variant="outline"
              className="bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30"
              onClick={() => {
                if (confirm(t('stations.confirm_deactivate_all', 'Deactivate all stations?'))) {
                  stations.forEach(station => {
                    supabase.from('hunt_stations').update({ is_active: false }).eq('id', station.id)
                  })
                  setTimeout(loadStations, 1000)
                }
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t('stations.deactivate_all', 'Deactivate All')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}