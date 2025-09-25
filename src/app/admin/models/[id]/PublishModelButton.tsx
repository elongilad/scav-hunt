'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Rocket } from 'lucide-react'
import { publishModelVersion } from '@/lib/actions/model-actions'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface PublishModelButtonProps {
  huntModelId: string
}

export function PublishModelButton({ huntModelId }: PublishModelButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()

  const handlePublish = async () => {
    try {
      setIsLoading(true)

      const result = await publishModelVersion({
        huntModelId,
        isActive: true
      })

      if (result.success) {
        alert(`✅ ${t('model_detail.publish_success', language)
          .replace('{version}', result.versionNumber?.toString() || '0')
          .replace('{stations}', result.stationsCount?.toString() || '0')
          .replace('{missions}', result.missionsCount?.toString() || '0')}`)
        window.location.reload() // Refresh to show new version
      } else {
        alert(`❌ ${t('model_detail.publish_error', language)}: ${result.error}`)
      }
    } catch (error) {
      console.error('Error publishing model:', error)
      alert(`❌ ${t('model_detail.publish_error', language)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePublish}
      disabled={isLoading}
      className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
    >
      <Rocket className="w-4 h-4 mr-2" />
      {isLoading ? t('model_detail.publishing', language) : t('model_detail.publish_model', language)}
    </Button>
  )
}