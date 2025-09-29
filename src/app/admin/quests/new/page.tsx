'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuestBuilder from '@/components/admin/QuestBuilder'
import { createAdminClient } from '@/lib/supabase/admin'

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

export default function NewQuestPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (quest: QuestTemplate) => {
    try {
      setError(null)

      // Create the quest template
      const response = await fetch('/api/admin/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create quest')
      }

      const { questId } = await response.json()

      // Redirect to the quest detail page
      router.push(`/admin/quests/${questId}`)

    } catch (err) {
      console.error('Error creating quest:', err)
      setError(err instanceof Error ? err.message : 'Failed to create quest')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
            <p>{error}</p>
          </div>
        )}

        <QuestBuilder onSave={handleSave} />
      </div>
    </div>
  )
}