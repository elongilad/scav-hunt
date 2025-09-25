'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { suggestStations } from '@/server/actions/poi/suggestStations'
import { MapPin, Search, Star } from 'lucide-react'

export default function TestPOIPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [eventId, setEventId] = useState('bacc012f-05dc-42b9-ad64-cac98dc3942b') // Example event ID
  const [lat, setLat] = useState(32.0853) // Tel Aviv coordinates
  const [lng, setLng] = useState(34.7818)
  const [radius, setRadius] = useState(1600)

  const handleSearch = async () => {
    try {
      setIsLoading(true)
      setSuggestions([])

      const result = await suggestStations({
        eventId,
        center: { lat, lng },
        radiusMeters: radius,
        maxResults: 50,
        includeFaithSites: true
      })

      if (result.ok) {
        setSuggestions(result.items)
      } else {
        alert('Failed to fetch suggestions')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error fetching suggestions: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptPOI = async (poi: any) => {
    try {
      // Here you would typically create a station from the POI
      // For now, we'll just show a success message and remove it from the list
      console.log('Accepting POI:', poi)

      // Remove from suggestions list
      setSuggestions(prev => prev.filter(p =>
        !(p.provider === poi.provider && p.provider_place_id === poi.provider_place_id)
      ))

      alert(`✅ "${poi.name}" accepted! A new station would be created at this location.`)
    } catch (error) {
      console.error('Error accepting POI:', error)
      alert('Error accepting POI: ' + (error as Error).message)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-6 h-6 text-spy-gold" />
        <h1 className="text-3xl font-bold text-white">POI Station Suggestions Test</h1>
      </div>

      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Search Parameters</CardTitle>
          <CardDescription className="text-gray-300">
            Configure the search area and fetch POI suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="lat" className="text-white">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="lng" className="text-white">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="radius" className="text-white">Search Radius (meters)</Label>
            <Input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value) || 1600)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search POIs'}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-spy-gold" />
              Found {suggestions.length} Suggestions
            </CardTitle>
            <CardDescription className="text-gray-300">
              Ranked by suitability for scavenger hunt stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suggestions.map((poi, index) => (
                <div
                  key={`${poi.provider}-${poi.provider_place_id}`}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{poi.name}</span>
                      <span className="text-xs bg-spy-gold/20 text-spy-gold px-2 py-0.5 rounded">
                        {poi.category}
                      </span>
                    </div>
                    {poi.address && (
                      <p className="text-sm text-gray-400 mt-1">{poi.address}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>Score: {poi.score}</span>
                      <span>Distance: {poi.distance_m}m</span>
                      <span>Provider: {poi.provider}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-spy-gold">#{index + 1}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 bg-spy-gold/20 border-spy-gold/40 text-spy-gold hover:bg-spy-gold/30"
                      onClick={() => handleAcceptPOI(poi)}
                    >
                      Accept
                    </Button>
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