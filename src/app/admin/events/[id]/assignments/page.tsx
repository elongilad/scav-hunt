'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssignmentsMatrix } from './components/AssignmentsMatrix'
import { assignTeamMissionToStation } from '@/server/actions/assignments/assignTeamMissionToStation'
import { buildStationTravelMatrix } from '@/server/actions/travel/buildStationTravelMatrix'
import { Users, MapPin, Clock, Route } from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
}

export default function AssignmentsPage({ params }: Props) {
  const [assignments, setAssignments] = useState<Record<string, Record<string, string>>>({})
  const [teams, setTeams] = useState<{id: string, name?: string}[]>([])
  const [missions, setMissions] = useState<{id: string, title?: string}[]>([])
  const [stations, setStations] = useState<{id: string, display_name?: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isBuildingMatrix, setIsBuildingMatrix] = useState(false)
  const [travelMatrixStatus, setTravelMatrixStatus] = useState<string>("")
  const [eventId, setEventId] = useState<string>("")

  // Resolve params and set eventId
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  // Mock data for now - in production, these would come from server components or API calls
  useEffect(() => {
    if (!eventId) return
    // Simulate loading data
    setTimeout(() => {
      setTeams([
        { id: "team-1", name: "Red Team" },
        { id: "team-2", name: "Blue Team" },
        { id: "team-3", name: "Green Team" }
      ])

      setMissions([
        { id: "mission-1", title: "Find the Secret Message" },
        { id: "mission-2", title: "Decode the Cipher" },
        { id: "mission-3", title: "Shadow Surveillance" },
        { id: "mission-4", title: "Dead Drop Recovery" }
      ])

      setStations([
        { id: "station-a", display_name: "Central Library" },
        { id: "station-b", display_name: "City Park" },
        { id: "station-c", display_name: "Museum Entrance" },
        { id: "station-d", display_name: "Café Corner" },
        { id: "station-e", display_name: "Train Station" }
      ])

      // Initialize empty assignments
      const initialAssignments: Record<string, Record<string, string>> = {}
      setAssignments(initialAssignments)

      setIsLoading(false)
    }, 1000)
  }, [eventId])

  const handleAssignmentChange = async (teamId: string, missionId: string, stationId: string) => {
    // Optimistically update the UI
    setAssignments(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [missionId]: stationId
      }
    }))

    // Save to database
    try {
      if (stationId) {
        await assignTeamMissionToStation({
          eventId: eventId,
          eventTeamId: teamId,
          eventMissionId: missionId,
          eventStationId: stationId,
          isRequired: true
        })
      }
    } catch (error) {
      console.error('Failed to save assignment:', error)
      // Revert the optimistic update
      setAssignments(prev => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          [missionId]: ''
        }
      }))
    }
  }

  const handleBuildTravelMatrix = async () => {
    setIsBuildingMatrix(true)
    setTravelMatrixStatus("Building travel matrix...")

    try {
      const result = await buildStationTravelMatrix({
        eventId: eventId,
        mode: "walking",
        provider: "osrm",
        forceRecalculate: false
      })

      if (result.ok) {
        setTravelMatrixStatus(
          result.skipped
            ? `Matrix already exists (${result.pairCount} station pairs)`
            : `Matrix built: ${result.stationCount} stations, ${result.pairCount} routes, avg ${Math.round(result.averageSeconds! / 60)}min`
        )
      } else {
        setTravelMatrixStatus(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error('Failed to build travel matrix:', error)
      setTravelMatrixStatus(`Failed: ${(error as Error).message}`)
    } finally {
      setIsBuildingMatrix(false)
    }
  }

  const getAssignmentSummary = () => {
    let totalAssignments = 0
    let totalPossible = teams.length * missions.length

    Object.values(assignments).forEach(teamAssignments => {
      Object.values(teamAssignments).forEach(stationId => {
        if (stationId) totalAssignments++
      })
    })

    return { totalAssignments, totalPossible }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading assignments...</div>
        </div>
      </div>
    )
  }

  const summary = getAssignmentSummary()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-spy-gold" />
        <h1 className="text-3xl font-bold text-white">Team Mission Assignments</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-spy-gold">{teams.length}</div>
            <div className="text-sm text-gray-400">Teams</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-spy-gold">{missions.length}</div>
            <div className="text-sm text-gray-400">Missions</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-spy-gold">{stations.length}</div>
            <div className="text-sm text-gray-400">Stations</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-spy-gold">
              {summary.totalAssignments}/{summary.totalPossible}
            </div>
            <div className="text-sm text-gray-400">Assigned</div>
          </CardContent>
        </Card>
      </div>

      {/* Travel Matrix Builder */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Route className="w-5 h-5" />
            Travel Matrix
          </CardTitle>
          <CardDescription className="text-gray-300">
            Build walking time matrix between stations for optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBuildTravelMatrix}
              disabled={isBuildingMatrix}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
            >
              <Clock className="w-4 h-4 mr-2" />
              {isBuildingMatrix ? 'Building Matrix...' : 'Build Travel Matrix'}
            </Button>
            {travelMatrixStatus && (
              <div className="text-sm text-gray-300">{travelMatrixStatus}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignments Matrix */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mission Assignments
          </CardTitle>
          <CardDescription className="text-gray-300">
            Assign each team's missions to specific stations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length > 0 && missions.length > 0 && stations.length > 0 ? (
            <AssignmentsMatrix
              teams={teams}
              missions={missions}
              stations={stations}
              value={assignments}
              onChange={handleAssignmentChange}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No teams, missions, or stations found for this event.</p>
              <p className="text-sm">Create teams and missions first, then add stations with coordinates.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Progress */}
      {summary.totalPossible > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Assignment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">Overall Progress</span>
                <span className="text-spy-gold font-semibold">
                  {Math.round((summary.totalAssignments / summary.totalPossible) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-spy-gold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(summary.totalAssignments / summary.totalPossible) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-400">
                {summary.totalAssignments} of {summary.totalPossible} missions assigned
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}