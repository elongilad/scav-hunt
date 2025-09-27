'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'
import { compileEvent } from '@/lib/actions/model-actions'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

interface CompileEventButtonProps {
  eventId: string
}

export function CompileEventButton({ eventId }: CompileEventButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()

  const handleCompile = async () => {
    try {
      setIsLoading(true)

      const result = await compileEvent({ eventId })

      if (result.success) {
        alert(`✅ ${result.message}`)
        window.location.reload() // Refresh to show updated status
      } else {
        alert(`❌ ${t('model_detail.compile_error', language)}: ${result.error}`)
      }
    } catch (error) {
      console.error('Error compiling event:', error)
      alert(`❌ ${t('model_detail.compile_error', language)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCompile}
      disabled={isLoading}
      className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
    >
      <Zap className="w-4 h-4 mr-2" />
      {isLoading ? t('model_detail.compiling', language) : t('model_detail.compile_event', language)}
    </Button>
  )
}