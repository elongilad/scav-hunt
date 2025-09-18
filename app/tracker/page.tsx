'use client'

import { useState, useEffect } from 'react'
import { getTeamVisits, clearAllTeamVisits, toggleTeamVisit } from '@/lib/supabase-direct'
import { RotateCcw, Users, MapPin, RefreshCw } from 'lucide-react'

// Team sequences
const TEAM_SEQUENCES = {
  'Team 1': ['GameOpen', 'SuperKeizer', 'Puzzle', 'synagogue', 'Pizza', 'Park2', 'BookCypher', 'GanWizo', 'Park4', 'SchoolGate', 'Amos', 'Cypher', 'HolyBagel', 'DefuseBomb', 'Park1', 'End'],
  'Team 2': ['GameOpen', 'Pizza', 'Park2', 'BookCypher', 'GanWizo', 'Park1', 'SuperKeizer', 'SchoolGate', 'Amos', 'Cypher', 'HolyBagel', 'Park4', 'DefuseBomb', 'Puzzle', 'synagogue', 'End'],
  'Team 3': ['GameOpen', 'Park4', 'Park3', 'Puzzle', 'synagogue', 'SchoolGate', 'Amos', 'Cypher', 'HolyBagel', 'DefuseBomb', 'Pizza', 'Park2', 'BookCypher', 'GanWizo', 'SuperKeizer', 'End'],
  'Team 4': ['GameOpen', 'Puzzle', 'synagogue', 'SchoolGate', 'Amos', 'Cypher', 'HolyBagel', 'DefuseBomb', 'Pizza', 'Park2', 'BookCypher', 'GanWizo', 'Park1', 'Park4', 'SuperKeizer', 'End'],
  'Team 5': ['GameOpen', 'SchoolGate', 'Amos', 'Cypher', 'HolyBagel', 'DefuseBomb', 'Pizza', 'Park2', 'BookCypher', 'GanWizo', 'Park1', 'Puzzle', 'synagogue', 'SuperKeizer', 'Park4', 'End']
}

// Team passwords
const TEAM_PASSWORDS = {
  'Team 1': '1111',
  'Team 2': '2222', 
  'Team 3': '3333',
  'Team 4': '4444',
  'Team 5': '5555'
}

interface TeamProgress {
  [teamName: string]: {
    [stationId: string]: {
      visited: boolean
      timestamp?: string
    }
  }
}

interface TeamVisit {
  id: number
  team_password: string
  station_id: string
  timestamp: string
  success: boolean
}

export default function TrackerPage() {
  const [teamProgress, setTeamProgress] = useState<TeamProgress>({})
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    loadTeamProgress()
    
    // Auto-refresh every minute (60 seconds)
    const interval = setInterval(loadTeamProgress, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadTeamProgress = async () => {
    setLoading(true)
    try {
      // Initialize empty progress
      const progress: TeamProgress = {}
      Object.keys(TEAM_SEQUENCES).forEach(team => {
        progress[team] = {}
        TEAM_SEQUENCES[team as keyof typeof TEAM_SEQUENCES].forEach(station => {
          progress[team][station] = { visited: false }
        })
      })

      // Load visits from database
      const visits: TeamVisit[] = await getTeamVisits()
      
      // Process successful visits only
      visits.filter(visit => visit.success).forEach(visit => {
        const teamName = getTeamNameFromPassword(visit.team_password)
        if (teamName && progress[teamName] && progress[teamName][visit.station_id]) {
          progress[teamName][visit.station_id] = {
            visited: true,
            timestamp: visit.timestamp
          }
        }
      })

      setTeamProgress(progress)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error loading team progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTeamNameFromPassword = (password: string): string | null => {
    const passwordMap: { [key: string]: string } = {
      '1111': 'Team 1',
      '2222': 'Team 2', 
      '3333': 'Team 3',
      '4444': 'Team 4',
      '5555': 'Team 5'
    }
    return passwordMap[password] || null
  }

  const getPasswordFromTeamName = (teamName: string): string => {
    return TEAM_PASSWORDS[teamName as keyof typeof TEAM_PASSWORDS] || ''
  }

  const handleStationClick = async (teamName: string, stationId: string) => {
    const teamPassword = getPasswordFromTeamName(teamName)
    if (!teamPassword) return

    setLoading(true)
    try {
      const success = await toggleTeamVisit(teamPassword, stationId)
      if (success) {
        await loadTeamProgress() // Refresh to show updated state
      }
    } catch (error) {
      console.error('Error toggling station:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetAllProgress = async () => {
    if (!confirm('Are you sure you want to reset all team progress? This will clear the tracking database.')) return
    
    setLoading(true)
    try {
      const success = await clearAllTeamVisits()
      if (success) {
        await loadTeamProgress() // Reload to show empty state
        alert('All team progress has been reset!')
      } else {
        alert('Failed to reset progress. Please try again.')
      }
    } catch (error) {
      console.error('Error resetting progress:', error)
      alert('Error resetting progress. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const getStationStatus = (teamName: string, stationId: string) => {
    return teamProgress[teamName]?.[stationId]?.visited || false
  }

  const getTeamProgress = (teamName: string) => {
    const sequence = TEAM_SEQUENCES[teamName as keyof typeof TEAM_SEQUENCES]
    const visited = sequence.filter(station => getStationStatus(teamName, station)).length
    return `${visited}/${sequence.length}`
  }

  const getTeamColor = (teamName: string) => {
    const colors = {
      'Team 1': 'bg-red-100 border-red-300',
      'Team 2': 'bg-blue-100 border-blue-300',
      'Team 3': 'bg-green-100 border-green-300',
      'Team 4': 'bg-yellow-100 border-yellow-300',
      'Team 5': 'bg-purple-100 border-purple-300'
    }
    return colors[teamName as keyof typeof colors] || 'bg-gray-100 border-gray-300'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8" />
              Team Progress Tracker
            </h1>
            <p className="text-gray-600 mt-2">Automatic tracking when teams enter passwords • Refreshes every minute</p>
            <p className="text-sm text-gray-500">Last updated: {lastUpdate} {loading && '(Refreshing...)'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadTeamProgress}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={resetAllProgress}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset All
            </button>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="space-y-8">
          {Object.keys(TEAM_SEQUENCES).map(teamName => (
            <div key={teamName} className={`${getTeamColor(teamName)} rounded-lg p-6 border-2`}>
              {/* Team Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{teamName}</h2>
                  <p className="text-gray-600">
                    Password: {TEAM_PASSWORDS[teamName as keyof typeof TEAM_PASSWORDS]} | 
                    Progress: {getTeamProgress(teamName)}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  Next: {TEAM_SEQUENCES[teamName as keyof typeof TEAM_SEQUENCES]
                    .find(station => !getStationStatus(teamName, station)) || 'Complete!'}
                </div>
              </div>

              {/* Station Sequence */}
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {TEAM_SEQUENCES[teamName as keyof typeof TEAM_SEQUENCES].map((stationId, index) => {
                  const isVisited = getStationStatus(teamName, stationId)
                  const timestamp = teamProgress[teamName]?.[stationId]?.timestamp
                  
                  return (
                    <div
                      key={`${teamName}-${stationId}`}
                      className={`
                        relative p-3 rounded-lg text-center cursor-pointer transition-all duration-200 border-2
                        ${isVisited 
                          ? 'bg-green-500 text-white border-green-600 shadow-lg hover:bg-green-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !loading && handleStationClick(teamName, stationId)}
                      title={`${stationId}${timestamp ? ` - ${new Date(timestamp).toLocaleTimeString()}` : ''} (Click to toggle)`}
                    >
                      <div className="text-xs font-medium">{index + 1}</div>
                      <div className="text-sm font-semibold truncate">{stationId}</div>
                      {isVisited && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      {timestamp && (
                        <div className="text-xs mt-1 opacity-75">
                          {new Date(timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{getTeamProgress(teamName)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(TEAM_SEQUENCES[teamName as keyof typeof TEAM_SEQUENCES]
                        .filter(station => getStationStatus(teamName, station)).length / 
                        TEAM_SEQUENCES[teamName as keyof typeof TEAM_SEQUENCES].length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Automatic Tracking:</h4>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                <span>Stations turn green when teams enter correct passwords</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-600" />
                <span>Updates automatically every minute</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Manual Control:</h4>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded cursor-pointer"></div>
                <span>Click white stations to mark as completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded cursor-pointer"></div>
                <span>Click green stations to mark as incomplete</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}