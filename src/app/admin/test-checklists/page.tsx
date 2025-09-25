'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateChecklists } from '@/server/actions/checklists/generateChecklists'
import { buildSetupRoute } from '@/server/actions/checklists/buildSetupRoute'
import { CheckCircle, Clock, MapPin, Route } from 'lucide-react'

export default function TestChecklistsPage() {
  const [eventId, setEventId] = useState('bacc012f-05dc-42b9-ad64-cac98dc3942b')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [checklistResult, setChecklistResult] = useState<any>(null)
  const [routeResult, setRouteResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleGenerateChecklists = async () => {
    if (!eventId.trim()) {
      setError('Please enter an event ID')
      return
    }

    setIsGenerating(true)
    setError('')
    setChecklistResult(null)

    try {
      const result = await generateChecklists({ eventId: eventId.trim() })
      setChecklistResult(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBuildSetupRoute = async () => {
    if (!eventId.trim()) {
      setError('Please enter an event ID')
      return
    }

    setIsBuilding(true)
    setError('')
    setRouteResult(null)

    try {
      const result = await buildSetupRoute({ eventId: eventId.trim() })
      setRouteResult(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsBuilding(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="w-6 h-6 text-spy-gold" />
        <h1 className="text-3xl font-bold text-white">Checklist Testing</h1>
      </div>

      {/* Input Form */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Event Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Test checklist generation and setup route optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventId" className="text-white">Event ID</Label>
            <Input
              id="eventId"
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Enter event UUID"
              className="bg-white/5 border-white/20 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateChecklists}
              disabled={isGenerating}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Checklists'}
            </Button>

            <Button
              onClick={handleBuildSetupRoute}
              disabled={isBuilding}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Route className="w-4 h-4 mr-2" />
              {isBuilding ? 'Building...' : 'Build Setup Route'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Results */}
      {checklistResult && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Checklist Generation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{checklistResult.taskCount}</div>
                <div className="text-sm text-gray-400">Total Tasks</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{checklistResult.stationsCount}</div>
                <div className="text-sm text-gray-400">Stations</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{checklistResult.enabledMissionsCount}</div>
                <div className="text-sm text-gray-400">Enabled Missions</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <div>✅ Pre-event checklist ID: <code className="text-spy-gold">{checklistResult.preEventChecklistId}</code></div>
              <div>✅ Day-of checklist ID: <code className="text-spy-gold">{checklistResult.dayOfChecklistId}</code></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Results */}
      {routeResult && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-400" />
              Setup Route Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white mb-6">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{routeResult.stationCount}</div>
                <div className="text-sm text-gray-400">Stations</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{routeResult.totalMinutes}</div>
                <div className="text-sm text-gray-400">Total Minutes</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{routeResult.optimizationIterations || 0}</div>
                <div className="text-sm text-gray-400">2-opt Iterations</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold">{routeResult.hasTravelData ? 'Yes' : 'No'}</div>
                <div className="text-sm text-gray-400">Has Travel Data</div>
              </div>
            </div>

            {routeResult.route && routeResult.route.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Optimized Setup Route
                </h3>
                <div className="space-y-2">
                  {routeResult.route.map((stop: any, index: number) => (
                    <div
                      key={stop.stationId}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-spy-gold text-black font-bold flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{stop.displayName}</div>
                        <div className="text-xs text-gray-400">
                          Station ID: {stop.stationId.slice(0, 8)}...
                          {stop.coordinates && (
                            <span className="ml-2">
                              📍 {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-md">
                  <p className="text-blue-200 text-sm">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Following this route will take approximately <strong>{routeResult.totalMinutes} minutes</strong> of travel time
                    {!routeResult.hasTravelData && ' (estimated using fallback calculations)'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}