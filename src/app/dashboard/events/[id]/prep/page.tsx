'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stepper } from '@/components/ui/stepper'
import { ArrowLeft, Clock, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getStepsForQuest, getTotalEstimatedTime, type PrepStep } from '@/lib/prep-steps'

// Step Components
import LocationSelectionStep from './steps/LocationSelectionStep'
import PhotoUploadStep from './steps/PhotoUploadStep'
import PDFGenerationStep from './steps/PDFGenerationStep'
import PropsSetupStep from './steps/PropsSetupStep'
import QRPlacementStep from './steps/QRPlacementStep'
import ActivationStep from './steps/ActivationStep'

interface EventData {
  id: string
  child_name: string
  model_id: string
  status: string
  hunt_models?: { name: string }
  stations: any[]
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function PrepWizardPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [prepSteps, setPrepSteps] = useState<PrepStep[]>([])

  const totalTime = getTotalEstimatedTime(prepSteps)

  useEffect(() => {
    loadEventData()
  }, [id])

  const loadEventData = async () => {
    try {
      const response = await fetch(`/api/debug/event/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch event data: ${response.status}`)
      }

      const debugData = await response.json()

      if (!debugData.eventData) {
        throw new Error('Event not found')
      }

      const transformedStations = debugData.stationsData?.map((station: any) => {
        const activity = station.default_activity || {};
        return {
          id: station.id,
          station_id: activity.station_id || station.id.split('_').pop() || '1',
          display_name: station.display_name || 'Quest Station',
          station_type: activity.station_type || station.type || 'activity',
          activity_description: activity.description || activity.instructions || 'Complete this quest activity',
          props_needed: activity.props_needed || []
        };
      }) || []

      const eventWithStations = {
        ...debugData.eventData,
        stations: transformedStations
      }

      setEvent(eventWithStations)

      // Generate dynamic prep steps based on quest data
      const questData = {
        modelName: debugData.eventData.hunt_models?.name || 'Quest',
        stationCount: transformedStations.length,
        stations: transformedStations
      }

      const dynamicSteps = getStepsForQuest(questData)
      setPrepSteps(dynamicSteps)

    } catch (error) {
      console.error('Error loading event data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]))

    // Auto-advance to next step if not on last step
    if (currentStepIndex < prepSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleStepNavigation = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex)
  }

  const getCurrentStepComponent = () => {
    const currentStep = prepSteps[currentStepIndex]
    const stepProps = {
      event,
      onComplete: () => handleStepComplete(currentStep.id),
      isCompleted: completedSteps.has(currentStep.id)
    }

    switch (currentStep.type) {
      case 'location_selection':
        return <LocationSelectionStep {...stepProps} />
      case 'photo_upload':
        return <PhotoUploadStep {...stepProps} />
      case 'pdf_generation':
        return <PDFGenerationStep {...stepProps} />
      case 'props_setup':
        return <PropsSetupStep {...stepProps} />
      case 'qr_placement':
        return <QRPlacementStep {...stepProps} />
      case 'activation':
        return <ActivationStep {...stepProps} />
      default:
        return <div>Step not implemented</div>
    }
  }

  // Convert prep steps to stepper format
  const stepperSteps = prepSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    status: completedSteps.has(step.id)
      ? 'completed' as const
      : index === currentStepIndex
        ? 'current' as const
        : 'pending' as const
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading prep wizard...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">Quest Not Found</h2>
            <p className="text-gray-600">We couldn't find this quest. Please try again.</p>
            <Link href="/catalog" className="inline-block mt-4">
              <Button>Return to Catalog</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard/events/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Quest Preparation</h1>
          <p className="text-gray-600 mt-1">
            {event.hunt_models?.name || event.child_name}
          </p>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{totalTime} minutes total
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {event.stations.length} stations
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {completedSteps.size}/{prepSteps.length} steps completed
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stepper Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preparation Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <Stepper
                steps={stepperSteps}
                className="space-y-6"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{prepSteps[currentStepIndex].title}</span>
                <Badge variant="outline">
                  Step {currentStepIndex + 1} of {prepSteps.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getCurrentStepComponent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => handleStepNavigation(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
            >
              Previous Step
            </Button>

            <Button
              onClick={() => handleStepNavigation(Math.min(prepSteps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === prepSteps.length - 1}
            >
              Next Step
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}