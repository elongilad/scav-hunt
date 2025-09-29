'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Globe,
  Eye,
  Clock,
  Users,
  MapPin,
  Target,
  Settings,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'

interface Quest {
  id: string
  name: string
  description: string
  active: boolean
  published: boolean
  duration_min: number
  age_min: number
  age_max: number
  created_at: string
  model_stations: Array<{
    id: string
    display_name: string
    type: string
    default_activity: {
      description: string
      props_needed: string[]
      estimated_duration: number
    }
  }>
  model_missions: Array<{
    id: string
    title: string
    clue: string
    to_station_id: string
    active: boolean
  }>
}

export default function QuestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const questId = params.id as string

  const [quest, setQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuest()
  }, [questId])

  const loadQuest = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/quests/${questId}`)
      if (!response.ok) {
        throw new Error('Failed to load quest')
      }

      const data = await response.json()
      setQuest(data.quest)

    } catch (err) {
      console.error('Error loading quest:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quest')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishToggle = async () => {
    if (!quest) return

    try {
      const response = await fetch(`/api/admin/quests/${questId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          published: !quest.published
        })
      })

      if (response.ok) {
        await loadQuest()
      }
    } catch (err) {
      console.error('Error toggling publish status:', err)
    }
  }

  const handleDelete = async () => {
    if (!quest) return

    if (!confirm(`Are you sure you want to delete "${quest.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/quests/${questId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/quests')
      }
    } catch (err) {
      console.error('Error deleting quest:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-navy via-gray-900 to-black p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !quest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-navy via-gray-900 to-black p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Quest Not Found</h2>
            <p className="text-gray-400 mb-8">{error || 'The quest you are looking for does not exist.'}</p>
            <Link href="/admin/quests">
              <Button className="bg-brand-teal hover:bg-brand-teal/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/quests">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quests
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white font-display">{quest.name}</h1>
              <p className="text-gray-400 mt-1">Quest Template Details</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {quest.active && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
            )}
            {quest.published && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Published
              </Badge>
            )}
          </div>
        </div>

        {/* Quest Overview */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{quest.name}</CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  {quest.description}
                </CardDescription>
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Ages {quest.age_min}-{quest.age_max}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{quest.duration_min} minutes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{quest.model_stations.length} stations</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>{quest.model_missions.length} missions</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePublishToggle}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {quest.published ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Publish
                    </>
                  )}
                </Button>

                <Link href={`/admin/quests/${quest.id}/edit`}>
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stations & Missions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Stations */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-brand-teal" />
                Stations ({quest.model_stations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quest.model_stations.length > 0 ? (
                quest.model_stations.map((station, index) => (
                  <div key={station.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">
                        {index + 1}. {station.display_name}
                      </h4>
                      <Badge variant="outline" className="text-xs bg-white/10 border-white/20">
                        {station.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {station.default_activity?.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>⏱️ {station.default_activity?.estimated_duration || 10}min</span>
                      {station.default_activity?.props_needed && station.default_activity.props_needed.length > 0 && (
                        <span>📦 {station.default_activity.props_needed.length} props</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No stations configured</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missions */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-brand-teal" />
                Missions ({quest.model_missions.filter(m => m.active).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quest.model_missions.filter(m => m.active).length > 0 ? (
                quest.model_missions.filter(m => m.active).map((mission, index) => (
                  <div key={mission.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">
                        {index + 1}. {mission.title}
                      </h4>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-sm text-gray-400">
                      {mission.clue}
                    </p>
                    {mission.to_station_id && (
                      <p className="text-xs text-gray-500 mt-2">
                        → Station: {quest.model_stations.find(s => s.id === mission.to_station_id)?.display_name || 'Unknown'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active missions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quest Status */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-brand-teal" />
              Quest Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-brand-teal">
                  {quest.published ? '✅' : '❌'}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {quest.published ? 'Published' : 'Draft'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {quest.published ? 'Available in marketplace' : 'Not visible to customers'}
                </p>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-brand-teal">
                  {quest.model_stations.length}
                </div>
                <p className="text-sm text-gray-400 mt-1">Stations</p>
                <p className="text-xs text-gray-500 mt-1">Physical locations</p>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-brand-teal">
                  {quest.model_missions.filter(m => m.active).length}
                </div>
                <p className="text-sm text-gray-400 mt-1">Active Missions</p>
                <p className="text-xs text-gray-500 mt-1">Story elements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}