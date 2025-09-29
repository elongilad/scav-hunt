'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QuestBuilder from '@/components/admin/QuestBuilder'

interface QuestTemplate {
  id?: string
  name: string
  description: string
  theme: string
  age_min: number
  age_max: number
  duration_min: number
  cover_image_url?: string
  stations: any[]
  missions: any[]
}

export default function EditQuestPage() {
  const params = useParams()
  const router = useRouter()
  const questId = params.id as string

  const [quest, setQuest] = useState<QuestTemplate | null>(null)
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
      const questData = data.quest

      // Transform the quest data to match QuestBuilder format
      const transformedQuest: QuestTemplate = {
        id: questData.id,
        name: questData.name,
        description: questData.description,
        theme: 'custom', // Default theme for existing quests
        age_min: questData.age_min,
        age_max: questData.age_max,
        duration_min: questData.duration_min,
        cover_image_url: questData.cover_image_url,
        stations: questData.model_stations?.map((station: any) => ({
          id: station.id,
          display_name: station.display_name,
          type: station.type,
          activity_description: station.default_activity?.description || '',
          props_needed: station.default_activity?.props_needed || [],
          estimated_duration: station.default_activity?.estimated_duration || 10,
          sequence: station.default_activity?.sequence || 1
        })) || [],
        missions: questData.model_missions?.map((mission: any) => ({
          id: mission.id,
          title: mission.title,
          clue: mission.clue,
          to_station_id: mission.to_station_id,
          active: mission.active
        })) || []
      }

      setQuest(transformedQuest)

    } catch (err) {
      console.error('Error loading quest:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quest')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updatedQuest: QuestTemplate) => {
    try {
      setError(null)

      // Update the quest template
      const response = await fetch(`/api/admin/quests/${questId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updatedQuest.name,
          description: updatedQuest.description,
          age_min: updatedQuest.age_min,
          age_max: updatedQuest.age_max,
          duration_min: updatedQuest.duration_min,
          cover_image_url: updatedQuest.cover_image_url
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quest')
      }

      // TODO: Handle updating stations and missions
      // This would require additional API endpoints for updating stations/missions

      // Redirect to the quest detail page
      router.push(`/admin/quests/${questId}`)

    } catch (err) {
      console.error('Error updating quest:', err)
      setError(err instanceof Error ? err.message : 'Failed to update quest')
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
            <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Quest</h2>
            <p className="text-gray-400 mb-8">{error || 'The quest could not be loaded for editing.'}</p>
            <button
              onClick={() => router.push('/admin/quests')}
              className="bg-brand-teal hover:bg-brand-teal/90 text-white px-6 py-2 rounded-lg"
            >
              Back to Quests
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
            <p>{error}</p>
          </div>
        )}

        <QuestBuilder onSave={handleSave} initialQuest={quest} />
      </div>
    </div>
  )
}