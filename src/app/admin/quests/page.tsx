'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  MapPin,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  Settings,
  Wand2,
  Target,
  CheckCircle,
  Globe
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
  }>
  model_missions: Array<{
    id: string
    title: string
    active: boolean
  }>
}

export default function QuestListPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuests()
  }, [])

  const loadQuests = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/quests')
      if (!response.ok) {
        throw new Error('Failed to load quests')
      }

      const data = await response.json()
      setQuests(data.quests || [])

    } catch (err) {
      console.error('Error loading quests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quests')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishToggle = async (questId: string, currentlyPublished: boolean) => {
    try {
      const response = await fetch(`/api/admin/quests/${questId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          published: !currentlyPublished
        })
      })

      if (response.ok) {
        await loadQuests() // Reload the list
      }
    } catch (err) {
      console.error('Error toggling publish status:', err)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Quest Templates</h1>
            <p className="text-gray-400 mt-2">Create and manage professional quest templates for your marketplace</p>
          </div>
          <Link href="/admin/quests/new">
            <Button className="bg-brand-teal hover:bg-brand-teal/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Quest
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
            <p>{error}</p>
          </div>
        )}

        {/* Quest Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
              <Wand2 className="h-4 w-4 text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-teal">{quests.length}</div>
              <p className="text-xs text-gray-400">
                {quests.filter(q => q.active).length} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Globe className="h-4 w-4 text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-teal">
                {quests.filter(q => q.published).length}
              </div>
              <p className="text-xs text-gray-400">
                Available in catalog
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
              <MapPin className="h-4 w-4 text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-teal">
                {quests.reduce((sum, q) => sum + q.model_stations.length, 0)}
              </div>
              <p className="text-xs text-gray-400">
                Across all quests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Missions</CardTitle>
              <Target className="h-4 w-4 text-brand-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-teal">
                {quests.reduce((sum, q) => sum + q.model_missions.length, 0)}
              </div>
              <p className="text-xs text-gray-400">
                Story elements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quest List */}
        <div className="space-y-4">
          {quests.length > 0 ? (
            quests.map((quest) => (
              <Card key={quest.id} className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl">{quest.name}</CardTitle>
                        <div className="flex space-x-2">
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
                      <CardDescription className="text-gray-400">
                        {quest.description}
                      </CardDescription>
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-300">
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
                        size="sm"
                        onClick={() => handlePublishToggle(quest.id, quest.published)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        {quest.published ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>

                      <Link href={`/admin/quests/${quest.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>

                      <Link href={`/admin/quests/${quest.id}`}>
                        <Button
                          size="sm"
                          className="bg-brand-teal hover:bg-brand-teal/90"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                {/* Station & Mission Preview */}
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Stations</h4>
                      <div className="space-y-1">
                        {quest.model_stations.slice(0, 3).map((station, index) => (
                          <div key={station.id} className="text-sm text-gray-400">
                            {index + 1}. {station.display_name}
                          </div>
                        ))}
                        {quest.model_stations.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{quest.model_stations.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Missions</h4>
                      <div className="space-y-1">
                        {quest.model_missions.filter(m => m.active).slice(0, 3).map((mission, index) => (
                          <div key={mission.id} className="text-sm text-gray-400">
                            {index + 1}. {mission.title}
                          </div>
                        ))}
                        {quest.model_missions.filter(m => m.active).length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{quest.model_missions.filter(m => m.active).length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="text-center py-20">
                <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-medium text-gray-400 mb-4">No quest templates yet</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Create your first quest template to start building amazing scavenger hunt experiences.
                  Use our theme-based generator to get started quickly!
                </p>
                <Link href="/admin/quests/new">
                  <Button className="bg-brand-teal hover:bg-brand-teal/90 text-lg px-8 py-3">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Quest
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}