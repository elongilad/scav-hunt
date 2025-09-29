import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Play, Sparkles, Users } from 'lucide-react'

interface ActivationStepProps {
  event: any
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivationStep({ event, onComplete, isCompleted }: ActivationStepProps) {
  const [isActivating, setIsActivating] = useState(false)
  const [questActivated, setQuestActivated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleActivateQuest = async () => {
    if (!event?.id) return

    setIsActivating(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate quest')
      }

      console.log('✅ Quest activated:', data)
      setQuestActivated(true)
      onComplete()

      // Redirect to quest dashboard after a brief success message
      setTimeout(() => {
        router.push(`/dashboard/events/${event.id}`)
      }, 2000)

    } catch (error) {
      console.error('Quest activation failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to activate quest')
    } finally {
      setIsActivating(false)
    }
  }

  if (questActivated || isCompleted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">Quest Activated! 🎉</h3>
          <p className="text-green-700 text-lg">
            Your quest is now ready for adventurers to begin!
          </p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <h4 className="text-lg font-semibold text-green-800 mb-4">
              What happens next?
            </h4>
            <div className="space-y-3 text-green-700">
              <p>✅ QR codes are now active and ready to scan</p>
              <p>✅ Mission videos will play when codes are scanned in order</p>
              <p>✅ Players can begin their adventure!</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
            <Users className="w-4 h-4 mr-2" />
            Manage Teams
          </Button>
          <Button variant="outline" size="lg">
            <Play className="w-4 h-4 mr-2" />
            View Quest Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Ready to Activate Quest!</h3>
        <p className="text-gray-600">
          All preparation steps are complete. Activate your quest to make it available for players.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quest Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Quest Type:</span>
              <span className="font-medium">{event?.hunt_models?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stations:</span>
              <span className="font-medium">{event?.stations?.length || 0} locations</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Duration:</span>
              <span className="font-medium">20-40 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-yellow-600">Ready for Activation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🚀 Final Checklist</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ All QR codes are placed and tested</li>
          <li>✅ Props and materials are ready</li>
          <li>✅ Quest locations are prepared</li>
          <li>✅ Adventure is ready to begin!</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">❌ Activation Failed</h4>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="text-center">
        <Button
          onClick={handleActivateQuest}
          disabled={isActivating}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {isActivating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Activating Quest...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Activate Quest
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500">
        Once activated, players can scan QR codes to begin their adventure!
      </div>
    </div>
  )
}