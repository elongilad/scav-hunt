'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildStationTravelMatrix } from '@/server/actions/travel/buildStationTravelMatrix'
import { Route, Clock, MapPin, Zap } from 'lucide-react'

export default function TestTravelPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [eventId, setEventId] = useState('bacc012f-05dc-42b9-ad64-cac98dc3942b')
  const [mode, setMode] = useState('walking')
  const [provider, setProvider] = useState('osrm')
  const [forceRecalculate, setForceRecalculate] = useState(false)

  const handleBuildMatrix = async () => {
    try {
      setIsLoading(true)
      setResults(null)

      const result = await buildStationTravelMatrix({
        eventId,
        mode: mode as 'walking' | 'transit' | 'driving',
        provider: provider as 'google' | 'mapbox' | 'osrm',
        forceRecalculate,
      })

      setResults(result)
    } catch (error) {
      console.error('Error:', error)
      alert('Error building travel matrix: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Route className="w-6 h-6 text-spy-gold" />
        <h1 className="text-3xl font-bold text-white">Travel Matrix Builder Test</h1>
      </div>

      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Build Travel Matrix
          </CardTitle>
          <CardDescription className="text-gray-300">
            Generate walking/driving times between all event stations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="eventId" className="text-white">Event ID</Label>
            <Input
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Event UUID"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mode" className="text-white">Travel Mode</Label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
              >
                <option value="walking">Walking</option>
                <option value="driving">Driving</option>
                <option value="transit">Transit</option>
              </select>
            </div>
            <div>
              <Label htmlFor="provider" className="text-white">Route Provider</Label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
              >
                <option value="osrm">OSRM (Free)</option>
                <option value="google">Google Maps</option>
                <option value="mapbox">Mapbox</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={forceRecalculate}
                  onChange={(e) => setForceRecalculate(e.target.checked)}
                  className="rounded"
                />
                <span>Force Recalculate</span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleBuildMatrix}
            disabled={isLoading}
            className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            <Clock className="w-4 h-4 mr-2" />
            {isLoading ? 'Building Matrix...' : 'Build Travel Matrix'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {results.ok ? (
                <Zap className="w-5 h-5 text-green-500" />
              ) : (
                <MapPin className="w-5 h-5 text-red-500" />
              )}
              Matrix Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.ok ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-spy-gold">{results.stationCount}</div>
                    <div className="text-sm text-gray-400">Stations</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-spy-gold">{results.pairCount}</div>
                    <div className="text-sm text-gray-400">Routes</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-spy-gold">
                      {Math.round(results.averageSeconds / 60)}m
                    </div>
                    <div className="text-sm text-gray-400">Avg Time</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-spy-gold">
                      {Math.round(results.maxSeconds / 60)}m
                    </div>
                    <div className="text-sm text-gray-400">Max Time</div>
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <Zap className="w-4 h-4" />
                    Success
                  </div>
                  <p className="text-green-300 mt-1">{results.message}</p>
                  <div className="text-sm text-green-200 mt-2">
                    <p>Provider: {results.provider}</p>
                    <p>Mode: {results.mode}</p>
                    {results.skipped && <p>ℹ️ Matrix already existed, skipped calculation</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 font-medium">
                  <MapPin className="w-4 h-4" />
                  Error
                </div>
                <p className="text-red-300 mt-1">{results.message}</p>
                {results.stationCount !== undefined && (
                  <p className="text-red-200 text-sm mt-2">
                    Found {results.stationCount} stations with coordinates
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-spy-gold mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-white">Station Detection</div>
              <div className="text-sm">Finds all stations with lat/lng coordinates in the event</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Route className="w-5 h-5 text-spy-gold mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-white">Route Calculation</div>
              <div className="text-sm">Uses OSRM, Google Maps, or Mapbox to calculate travel times</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-spy-gold mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-white">Matrix Storage</div>
              <div className="text-sm">Saves all pairwise travel times to enable route optimization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}