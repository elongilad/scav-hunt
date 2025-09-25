'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { instantiateEvent } from '@/lib/actions/model-actions'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface CreateEventButtonProps {
  modelVersionId: string
}

export function CreateEventButton({ modelVersionId }: CreateEventButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()

  const handleCreateEvent = async () => {
    try {
      setIsLoading(true)

      // Simple prompt for event title
      const title = prompt(t('model_detail.event_name', language), t('model_detail.new_hunt', language))

      if (!title) {
        return
      }

      const result = await instantiateEvent({
        modelVersionId,
        title,
        locale: language
      })

      if (result.success) {
        alert(`✅ ${t('model_detail.event_created', language)}`)
        // Redirect to admin events page
        window.location.href = '/admin/events'
      } else {
        alert(`❌ ${t('model_detail.event_error', language)}: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert(`❌ ${t('model_detail.event_error', language)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCreateEvent}
      disabled={isLoading}
      variant="outline"
      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
    >
      <Settings className="w-4 h-4 mr-2" />
      {isLoading ? t('model_detail.creating_event', language) : t('model_detail.create_event', language)}
    </Button>
  )
}