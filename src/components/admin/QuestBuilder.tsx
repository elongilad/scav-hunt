'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Trash2,
  Save,
  MapPin,
  Clock,
  Users,
  Puzzle,
  Eye,
  Settings,
  Wand2,
  Target
} from 'lucide-react'

interface Station {
  id: string
  display_name: string
  type: string
  activity_description?: string
  props_needed?: string[]
  estimated_duration?: number
  sequence?: number
}

interface Mission {
  id: string
  to_station_id?: string
  title: string
  clue: any
  active: boolean
}

interface QuestTemplate {
  id?: string
  name: string
  description: string
  theme: string
  age_min: number
  age_max: number
  duration_min: number
  cover_image_url?: string
  stations: Station[]
  missions: Mission[]
}

const questThemes = [
  { id: 'spy-mission', name: 'Secret Agent Mission', icon: '🕵️' },
  { id: 'pirate-treasure', name: 'Pirate Treasure Hunt', icon: '🏴‍☠️' },
  { id: 'detective-mystery', name: 'Detective Mystery', icon: '🔍' },
  { id: 'space-exploration', name: 'Space Exploration', icon: '🚀' },
  { id: 'fairy-tale', name: 'Fairy Tale Adventure', icon: '🧚' },
  { id: 'superhero', name: 'Superhero Mission', icon: '🦸' }
]

const stationTypes = [
  { id: 'qr', name: 'QR Code Station', description: 'Simple scan and complete' },
  { id: 'puzzle', name: 'Puzzle Challenge', description: 'Solve riddles or brain teasers' },
  { id: 'photo', name: 'Photo Mission', description: 'Take specific photos' },
  { id: 'cipher', name: 'Code Breaking', description: 'Decode secret messages' },
  { id: 'physical', name: 'Physical Challenge', description: 'Complete physical tasks' },
  { id: 'treasure', name: 'Find Hidden Item', description: 'Locate hidden objects' }
]

export default function QuestBuilder({
  initialQuest,
  onSave
}: {
  initialQuest?: QuestTemplate
  onSave: (quest: QuestTemplate) => Promise<void>
}) {
  const [quest, setQuest] = useState<QuestTemplate>(initialQuest || {
    name: '',
    description: '',
    theme: '',
    age_min: 6,
    age_max: 14,
    duration_min: 45,
    stations: [],
    missions: []
  })

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'stations' | 'missions'>('basic')

  const addStation = () => {
    const newStation: Station = {
      id: `station-${Date.now()}`,
      display_name: `Station ${quest.stations.length + 1}`,
      type: 'qr',
      activity_description: '',
      props_needed: [],
      estimated_duration: 10,
      sequence: quest.stations.length + 1
    }

    setQuest(prev => ({
      ...prev,
      stations: [...prev.stations, newStation]
    }))
  }

  const updateStation = (index: number, updates: Partial<Station>) => {
    setQuest(prev => ({
      ...prev,
      stations: prev.stations.map((station, i) =>
        i === index ? { ...station, ...updates } : station
      )
    }))
  }

  const removeStation = (index: number) => {
    setQuest(prev => ({
      ...prev,
      stations: prev.stations.filter((_, i) => i !== index)
    }))
  }

  const addMission = () => {
    const newMission: Mission = {
      id: `mission-${Date.now()}`,
      title: `Mission ${quest.missions.length + 1}`,
      clue: { text: 'Your next clue goes here...' },
      active: true
    }

    setQuest(prev => ({
      ...prev,
      missions: [...prev.missions, newMission]
    }))
  }

  const updateMission = (index: number, updates: Partial<Mission>) => {
    setQuest(prev => ({
      ...prev,
      missions: prev.missions.map((mission, i) =>
        i === index ? { ...mission, ...updates } : mission
      )
    }))
  }

  const removeMission = (index: number) => {
    setQuest(prev => ({
      ...prev,
      missions: prev.missions.filter((_, i) => i !== index)
    }))
  }

  const generateFromTheme = () => {
    const theme = questThemes.find(t => t.id === quest.theme)
    if (!theme) return

    // Generate theme-appropriate stations
    let stations: Station[] = []
    let missions: Mission[] = []

    switch (quest.theme) {
      case 'spy-mission':
        stations = [
          {
            id: 'spy-briefing',
            display_name: 'Mission Briefing',
            type: 'qr',
            activity_description: 'Receive your secret mission briefing',
            estimated_duration: 5,
            sequence: 1
          },
          {
            id: 'code-breaking',
            display_name: 'Code Breaking Station',
            type: 'cipher',
            activity_description: 'Decode the secret message using the cipher wheel',
            props_needed: ['Cipher wheel', 'Encoded message'],
            estimated_duration: 15,
            sequence: 2
          },
          {
            id: 'stealth-mission',
            display_name: 'Stealth Challenge',
            type: 'physical',
            activity_description: 'Complete the stealth course without being detected',
            estimated_duration: 10,
            sequence: 3
          },
          {
            id: 'evidence-collection',
            display_name: 'Evidence Collection',
            type: 'photo',
            activity_description: 'Photograph the secret evidence without being seen',
            estimated_duration: 8,
            sequence: 4
          },
          {
            id: 'final-mission',
            display_name: 'Final Mission',
            type: 'puzzle',
            activity_description: 'Complete your final mission to save the day',
            estimated_duration: 12,
            sequence: 5
          }
        ]

        missions = [
          {
            id: 'mission-1',
            to_station_id: 'spy-briefing',
            title: 'Agent Assignment',
            clue: { text: 'Welcome Agent! Your mission awaits at the briefing point.' },
            active: true
          },
          {
            id: 'mission-2',
            to_station_id: 'code-breaking',
            title: 'Decode the Message',
            clue: { text: 'The enemy has sent coded messages. Find the cipher station to decode them.' },
            active: true
          },
          {
            id: 'mission-3',
            to_station_id: 'stealth-mission',
            title: 'Stealth Infiltration',
            clue: { text: 'Navigate the area without being detected by enemy agents.' },
            active: true
          },
          {
            id: 'mission-4',
            to_station_id: 'evidence-collection',
            title: 'Gather Evidence',
            clue: { text: 'Capture photographic evidence of the enemy operation.' },
            active: true
          },
          {
            id: 'mission-5',
            to_station_id: 'final-mission',
            title: 'Complete the Mission',
            clue: { text: 'Time to complete your final objective and save the day!' },
            active: true
          }
        ]
        break

      case 'pirate-treasure':
        stations = [
          {
            id: 'pirate-ship',
            display_name: 'Pirate Ship',
            type: 'qr',
            activity_description: 'Board the pirate ship and receive your treasure map',
            estimated_duration: 5,
            sequence: 1
          },
          {
            id: 'map-reading',
            display_name: 'Navigate by Map',
            type: 'puzzle',
            activity_description: 'Use the treasure map to find the next location',
            props_needed: ['Treasure map', 'Compass'],
            estimated_duration: 12,
            sequence: 2
          },
          {
            id: 'riddle-cave',
            display_name: 'Riddle Cave',
            type: 'puzzle',
            activity_description: 'Solve the ancient pirate riddle to continue',
            estimated_duration: 10,
            sequence: 3
          },
          {
            id: 'treasure-dig',
            display_name: 'Treasure Dig',
            type: 'treasure',
            activity_description: 'Find the buried treasure chest',
            props_needed: ['Treasure chest', 'Shovel (toy)'],
            estimated_duration: 8,
            sequence: 4
          }
        ]

        missions = [
          {
            id: 'mission-1',
            to_station_id: 'pirate-ship',
            title: 'Join the Crew',
            clue: { text: 'Ahoy matey! Find the pirate ship to start your treasure hunt.' },
            active: true
          },
          {
            id: 'mission-2',
            to_station_id: 'map-reading',
            title: 'Follow the Map',
            clue: { text: 'X marks the spot! Use your map to navigate to the next location.' },
            active: true
          },
          {
            id: 'mission-3',
            to_station_id: 'riddle-cave',
            title: 'Solve the Riddle',
            clue: { text: 'The ancient cave holds secrets. Solve the pirate riddle to proceed.' },
            active: true
          },
          {
            id: 'mission-4',
            to_station_id: 'treasure-dig',
            title: 'Find the Treasure',
            clue: { text: 'The treasure awaits! Dig carefully to find your prize.' },
            active: true
          }
        ]
        break

      // Add more themes as needed
      default:
        return
    }

    setQuest(prev => ({
      ...prev,
      stations,
      missions,
      duration_min: stations.reduce((sum, s) => sum + (s.estimated_duration || 0), 0)
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(quest)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quest Builder</h1>
          <p className="text-gray-400">Create engaging quest templates for your marketplace</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !quest.name || quest.stations.length === 0}
          className="bg-brand-teal hover:bg-brand-teal/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Quest'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
        {[
          { id: 'basic', label: 'Basic Info', icon: Settings },
          { id: 'stations', label: 'Stations', icon: MapPin },
          { id: 'missions', label: 'Missions', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-brand-teal text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle>Quest Information</CardTitle>
              <CardDescription className="text-gray-400">
                Basic details about your quest template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quest Name</label>
                <Input
                  value={quest.name}
                  onChange={(e) => setQuest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Secret Agent Mission"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={quest.description}
                  onChange={(e) => setQuest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what makes this quest special..."
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <Select value={quest.theme} onValueChange={(value) => setQuest(prev => ({ ...prev, theme: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {questThemes.map(theme => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.icon} {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {quest.theme && (
                <Button
                  onClick={generateFromTheme}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Stations & Missions from Theme
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle>Quest Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Age ranges and duration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Age</label>
                  <Input
                    type="number"
                    value={quest.age_min}
                    onChange={(e) => setQuest(prev => ({ ...prev, age_min: parseInt(e.target.value) }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Age</label>
                  <Input
                    type="number"
                    value={quest.age_max}
                    onChange={(e) => setQuest(prev => ({ ...prev, age_max: parseInt(e.target.value) }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={quest.duration_min}
                  onChange={(e) => setQuest(prev => ({ ...prev, duration_min: parseInt(e.target.value) }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              {/* Quest Stats */}
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium mb-3">Quest Overview</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-brand-teal font-bold">{quest.stations.length}</div>
                    <div className="text-gray-400">Stations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-brand-teal font-bold">{quest.missions.length}</div>
                    <div className="text-gray-400">Missions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-brand-teal font-bold">{quest.age_min}-{quest.age_max}</div>
                    <div className="text-gray-400">Age Range</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stations Tab */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Quest Stations</h2>
            <Button onClick={addStation} className="bg-brand-teal hover:bg-brand-teal/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Station
            </Button>
          </div>

          <div className="grid gap-4">
            {quest.stations.map((station, index) => (
              <Card key={station.id} className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-brand-teal rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{station.display_name}</CardTitle>
                        <Badge variant="outline" className="border-white/20 text-gray-300">
                          {stationTypes.find(t => t.id === station.type)?.name || station.type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeStation(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Station Name</label>
                      <Input
                        value={station.display_name}
                        onChange={(e) => updateStation(index, { display_name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <Select
                        value={station.type}
                        onValueChange={(value) => updateStation(index, { type: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stationTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Activity Description</label>
                    <Textarea
                      value={station.activity_description || ''}
                      onChange={(e) => updateStation(index, { activity_description: e.target.value })}
                      placeholder="Describe what teams need to do at this station..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={station.estimated_duration || 10}
                        onChange={(e) => updateStation(index, { estimated_duration: parseInt(e.target.value) })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Props Needed</label>
                      <Input
                        value={(station.props_needed || []).join(', ')}
                        onChange={(e) => updateStation(index, {
                          props_needed: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="e.g., Cipher wheel, Map, Treasure chest"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {quest.stations.length === 0 && (
              <Card className="bg-white/5 border-white/10 text-white">
                <CardContent className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No stations yet</h3>
                  <p className="text-gray-500 mb-4">Add stations to create your quest adventure</p>
                  <Button onClick={addStation} className="bg-brand-teal hover:bg-brand-teal/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Station
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Quest Missions</h2>
            <Button onClick={addMission} className="bg-brand-teal hover:bg-brand-teal/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Mission
            </Button>
          </div>

          <div className="grid gap-4">
            {quest.missions.map((mission, index) => (
              <Card key={mission.id} className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mission.title}</CardTitle>
                    <Button
                      onClick={() => removeMission(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Mission Title</label>
                      <Input
                        value={mission.title}
                        onChange={(e) => updateMission(index, { title: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Target Station</label>
                      <Select
                        value={mission.to_station_id || ''}
                        onValueChange={(value) => updateMission(index, { to_station_id: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                        <SelectContent>
                          {quest.stations.map(station => (
                            <SelectItem key={station.id} value={station.id}>
                              {station.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mission Clue</label>
                    <Textarea
                      value={mission.clue?.text || ''}
                      onChange={(e) => updateMission(index, {
                        clue: { text: e.target.value }
                      })}
                      placeholder="Write the clue that guides teams to the next station..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {quest.missions.length === 0 && (
              <Card className="bg-white/5 border-white/10 text-white">
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No missions yet</h3>
                  <p className="text-gray-500 mb-4">Add missions to guide teams through your quest</p>
                  <Button onClick={addMission} className="bg-brand-teal hover:bg-brand-teal/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Mission
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}