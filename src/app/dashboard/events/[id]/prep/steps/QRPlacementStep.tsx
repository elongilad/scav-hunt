import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { QrCode, MapPin, CheckCircle, Map } from 'lucide-react'

interface QRPlacementStepProps {
  event: any
  onComplete: () => void
  isCompleted: boolean
}

export default function QRPlacementStep({ event, onComplete, isCompleted }: QRPlacementStepProps) {
  const [placedQRs, setPlacedQRs] = useState<Set<string>>(new Set())

  const handleQRToggle = (stationId: string, checked: boolean) => {
    setPlacedQRs(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(stationId)
      } else {
        newSet.delete(stationId)
      }
      return newSet
    })
  }

  const allQRsPlaced = event?.stations?.every((station: any) => placedQRs.has(station.id)) ?? false

  return (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Place QR Codes</h3>
        <p className="text-gray-600">
          Hide QR codes at each station location. Make sure they're accessible but not too obvious!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Map className="w-5 h-5" />
            <span>QR Code Placement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {event?.stations?.map((station: any, index: number) => {
              const isPlaced = placedQRs.has(station.id)

              return (
                <div
                  key={station.id}
                  className={`p-4 rounded-lg border ${
                    isPlaced
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isPlaced}
                      onCheckedChange={(checked) => handleQRToggle(station.id, checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium">Station {index + 1}: {station.display_name}</h4>
                        {isPlaced && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {station.activity_description}
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Placement tip:</strong> Hide the QR code near where this activity takes place,
                          but make sure it's scannable with a phone camera.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Placement Guidelines</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• QR codes should be at eye level or slightly below</li>
          <li>• Ensure good lighting for scanning</li>
          <li>• Protect from wind or rain if outdoors</li>
          <li>• Don't place QR codes too obviously - kids should search a little!</li>
          <li>• Test scan each QR code after placement</li>
        </ul>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{placedQRs.size}</span> of{' '}
            <span className="font-medium">{event?.stations?.length || 0}</span> QR codes placed
          </div>
          {allQRsPlaced && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              All QR codes placed
            </div>
          )}
        </div>

        <Button
          onClick={onComplete}
          disabled={!allQRsPlaced || isCompleted}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCompleted ? 'Completed' : 'Complete Step'}
        </Button>
      </div>
    </div>
  )
}