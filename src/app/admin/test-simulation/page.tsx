'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { simulateEventSchedule } from '@/server/actions/simulation/simulateEventSchedule'
import { Clock, Users, Route, Settings } from 'lucide-react'

export default function TestSimulationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [eventId, setEventId] = useState('bacc012f-05dc-42b9-ad64-cac98dc3942b')
  const [simulateParallelHQMissions, setSimulateParallelHQMissions] = useState(true)
  const [estimatePropHandoffTime, setEstimatePropHandoffTime] = useState(300)
  const [warmupBufferMinutes, setWarmupBufferMinutes] = useState(5)

  const handleSimulate = async () => {
    try {
      setIsLoading(true)
      setResults(null)

      const result = await simulateEventSchedule({
        eventId,
        simulateParallelHQMissions,
        estimatePropHandoffTime,
        warmupBufferMinutes,
      })

      setResults(result)
    } catch (error) {
      console.error('Error:', error)
      alert('Error running simulation: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6 text-spy-gold" />
        <h1 className="text-3xl font-bold text-white">Event Schedule Simulation Test</h1>
      </div>

      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Simulation Parameters
          </CardTitle>
          <CardDescription className="text-gray-300">
            Configure the simulation settings and run event scheduling
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
              <Label htmlFor="propHandoff" className="text-white">Prop Handoff Time (seconds)</Label>
              <Input
                id="propHandoff"
                type="number"
                value={estimatePropHandoffTime}
                onChange={(e) => setEstimatePropHandoffTime(parseInt(e.target.value) || 300)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="warmupBuffer" className="text-white">Warmup Buffer (minutes)</Label>
              <Input
                id="warmupBuffer"
                type="number"
                value={warmupBufferMinutes}
                onChange={(e) => setWarmupBufferMinutes(parseInt(e.target.value) || 5)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={simulateParallelHQMissions}
                  onChange={(e) => setSimulateParallelHQMissions(e.target.checked)}
                  className="rounded"
                />
                <span>Parallel HQ Missions</span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={isLoading}
            className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            <Clock className="w-4 h-4 mr-2" />
            {isLoading ? 'Running Simulation...' : 'Run Schedule Simulation'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-spy-gold" />
              Simulation Results
            </CardTitle>
            <CardDescription className="text-gray-300">
              Optimized team schedules and timing estimates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-spy-gold">{results.totalTeams}</div>
                <div className="text-sm text-gray-400">Total Teams</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-spy-gold">{results.averageDurationMinutes}m</div>
                <div className="text-sm text-gray-400">Average Duration</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {results.ok ? 'Success' : 'Failed'}
                </div>
                <div className="text-sm text-gray-400">Status</div>
              </div>
            </div>

            {results.note && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">{results.note}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Schedules
              </h3>
              {results.schedules?.map((schedule: any, index: number) => (
                <div
                  key={schedule.teamId}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">{schedule.teamName}</h4>
                      <p className="text-sm text-gray-400">Team ID: {schedule.teamId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-spy-gold">
                        {schedule.estimatedDurationMinutes}m
                      </div>
                      <div className="text-sm text-gray-400">
                        ({schedule.totalSeconds}s total)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-300 font-medium">Station Order:</div>
                    <div className="flex flex-wrap gap-2">
                      {schedule.stationOrder?.map((stationId: string, stationIndex: number) => (
                        <div
                          key={stationIndex}
                          className="flex items-center gap-2"
                        >
                          <span className="bg-spy-gold/20 text-spy-gold px-3 py-1 rounded-full text-sm">
                            #{stationIndex + 1}: {stationId}
                          </span>
                          {stationIndex < schedule.stationOrder.length - 1 && (
                            <span className="text-gray-500">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}