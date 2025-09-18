'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RotateCcw, Users, MapPin } from 'lucide-react'

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

export default function TrackerPage() {
  const [teamProgress, setTeamProgress] = useState<TeamProgress>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Initialize team progress
    const initialProgress: TeamProgress = {}
    Object.keys(TEAM_SEQUENCES).forEach(team => {
      initialProgress[team] = {}
      TEAM_SEQUENCES[team as keyof typeof TEAM_SEQUENCES].forEach(station => {
        initialProgress[team][station] = { visited: false }
      })
    })
    setTeamProgress(initialProgress)

    // Load existing progress from localStorage
    const savedProgress = localStorage.getItem('teamProgress')
    if (savedProgress) {
      try {
        setTeamProgress(JSON.parse(savedProgress))
      } catch (error) {
        console.error('Error loading saved progress:', error)
      }
    }

    // Set up real-time listener for station visits
    setupRealtimeListener()
  }, [])

  const setupRealtimeListener = () => {
    // Listen for changes in stations table to detect when teams enter passwords
    const subscription = supabase
      .channel('station-visits')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stations' }, 
        (payload) => {
          console.log('Station activity detected:', payload)
          // This would need a more sophisticated tracking system
          // For now, we'll rely on manual updates or polling
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const markStationVisited = (teamName: string, stationId: string) => {
    const updatedProgress = {
      ...teamProgress,
      [teamName]: {
        ...teamProgress[teamName],
        [stationId]: {
          visited: true,
          timestamp: new Date().toISOString()
        }
      }
    }
    setTeamProgress(updatedProgress)
    localStorage.setItem('teamProgress', JSON.stringify(updatedProgress))
  }

  const resetAllProgress = () => {
    if (!confirm('Are you sure you want to reset all team progress?')) return
    
    const resetProgress: TeamProgress = {}
    Object.keys(TEAM_SEQUENCES).forEach(team => {
      resetProgress[team] = {}
      TEAM_SEQUENCES[team as keyof typeof TEAM_SEQUENCES].forEach(station => {
        resetProgress[team][station] = { visited: false }
      })
    })
    setTeamProgress(resetProgress)
    localStorage.removeItem('teamProgress')
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
            <p className="text-gray-600 mt-2">Real-time tracking of team progress through stations</p>
          </div>
          <button
            onClick={resetAllProgress}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset All Progress
          </button>
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
                <button
                  onClick={() => {
                    const nextStation = TEAM_SEQUENCES[teamName as keyof typeof TEAM_SEQUENCES]
                      .find(station => !getStationStatus(teamName, station))
                    if (nextStation) {
                      markStationVisited(teamName, nextStation)
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Mark Next Complete
                </button>
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
                          ? 'bg-green-500 text-white border-green-600 shadow-lg' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }
                      `}
                      onClick={() => markStationVisited(teamName, stationId)}
                      title={`${stationId}${timestamp ? ` - ${new Date(timestamp).toLocaleTimeString()}` : ''}`}
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
          <h3 className="text-lg font-semibold mb-2">Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
              <span>Not visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span>Click on station to mark as completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}