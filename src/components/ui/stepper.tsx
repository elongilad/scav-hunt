import React from 'react'
import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description?: string
  status: 'pending' | 'current' | 'completed'
}

interface StepperProps {
  steps: Step[]
  className?: string
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <nav className={cn('flex flex-col space-y-4', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="relative">
            {/* Step Content */}
            <div className="flex items-start">
              {/* Step Icon */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2',
                    {
                      'border-green-500 bg-green-500': step.status === 'completed',
                      'border-blue-500 bg-blue-500': step.status === 'current',
                      'border-gray-300 bg-white': step.status === 'pending',
                    }
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : step.status === 'current' ? (
                    <div className="h-3 w-3 rounded-full bg-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Step Details */}
              <div className="ml-4 min-w-0 flex-1">
                <div
                  className={cn('text-sm font-medium', {
                    'text-green-600': step.status === 'completed',
                    'text-blue-600': step.status === 'current',
                    'text-gray-500': step.status === 'pending',
                  })}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div
                    className={cn('text-sm', {
                      'text-green-500': step.status === 'completed',
                      'text-blue-500': step.status === 'current',
                      'text-gray-400': step.status === 'pending',
                    })}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-4 top-8 h-6 w-0.5',
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}