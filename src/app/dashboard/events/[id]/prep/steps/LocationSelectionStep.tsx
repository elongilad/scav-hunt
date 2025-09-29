import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, CheckCircle, Home } from 'lucide-react'

interface LocationSelectionStepProps {
  event: any
  onComplete: () => void
  isCompleted: boolean
}

// Common house locations for Home Hunt
const HOUSE_LOCATIONS = [
  { id: 'kitchen', name: 'Kitchen', description: 'Near the refrigerator or stove' },
  { id: 'living_room', name: 'Living Room', description: 'Near the couch or TV' },
  { id: 'bedroom', name: 'Bedroom', description: 'Master bedroom or child\'s room' },
  { id: 'bathroom', name: 'Bathroom', description: 'Near the mirror or sink' },
  { id: 'garage', name: 'Garage', description: 'Near the car or workbench' },
  { id: 'backyard', name: 'Backyard', description: 'Garden, patio, or BBQ area' },
  { id: 'laundry', name: 'Laundry Room', description: 'Near washing machine or dryer' },
  { id: 'front_door', name: 'Front Door', description: 'Entrance or porch area' },
  { id: 'stairs', name: 'Stairs', description: 'Staircase or landing' },
  { id: 'closet', name: 'Closet', description: 'Walk-in or hallway closet' }
]

export default function LocationSelectionStep({ event, onComplete, isCompleted }: LocationSelectionStepProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [locationMappings, setLocationMappings] = useState<Record<string, string>>({})

  const requiredStations = event?.stations?.length || 0
  const canProceed = selectedLocations.length >= requiredStations

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    if (checked) {
      setSelectedLocations(prev => [...prev, locationId])
    } else {
      setSelectedLocations(prev => prev.filter(id => id !== locationId))
      // Remove any station mappings for this location
      setLocationMappings(prev => {
        const newMappings = { ...prev }
        Object.keys(newMappings).forEach(stationId => {
          if (newMappings[stationId] === locationId) {
            delete newMappings[stationId]
          }
        })
        return newMappings
      })
    }
  }

  const handleStationMapping = (stationId: string, locationId: string) => {
    setLocationMappings(prev => ({
      ...prev,
      [stationId]: locationId
    }))
  }

  const handleComplete = () => {
    // Save the location selections and mappings
    console.log('Location selections:', selectedLocations)
    console.log('Station mappings:', locationMappings)
    onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Select Available Locations</h3>
        <p className="text-gray-600">
          Choose {requiredStations} locations in your house where you can place quest stations.
          You can deselect any locations that aren't available.
        </p>
      </div>

      {/* Available Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available House Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOUSE_LOCATIONS.map((location) => {
              const isSelected = selectedLocations.includes(location.id)

              return (
                <div
                  key={location.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleLocationToggle(location.id, !isSelected)}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleLocationToggle(location.id, checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium">{location.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Station Mapping */}
      {selectedLocations.length > 0 && event?.stations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Map Stations to Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.stations.map((station: any) => (
                <div key={station.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{station.display_name}</h4>
                    <p className="text-sm text-gray-600">{station.activity_description}</p>
                  </div>
                  <select
                    value={locationMappings[station.id] || ''}
                    onChange={(e) => handleStationMapping(station.id, e.target.value)}
                    className="border rounded px-3 py-2 min-w-[150px]"
                  >
                    <option value="">Select location...</option>
                    {selectedLocations.map(locationId => {
                      const location = HOUSE_LOCATIONS.find(l => l.id === locationId)
                      return (
                        <option key={locationId} value={locationId}>
                          {location?.name}
                        </option>
                      )
                    })}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress & Actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{selectedLocations.length}</span> of{' '}
            <span className="font-medium">{requiredStations}</span> locations selected
          </div>
          {canProceed && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Ready to proceed
            </div>
          )}
        </div>

        <Button
          onClick={handleComplete}
          disabled={!canProceed || isCompleted}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCompleted ? 'Completed' : 'Complete Step'}
        </Button>
      </div>
    </div>
  )
}