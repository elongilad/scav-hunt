import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload, CheckCircle, Image } from 'lucide-react'

interface PhotoUploadStepProps {
  event: any
  onComplete: () => void
  isCompleted: boolean
}

export default function PhotoUploadStep({ event, onComplete, isCompleted }: PhotoUploadStepProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])

  const handlePhotoUpload = (files: FileList) => {
    const newPhotos = Array.from(files)
    setUploadedPhotos(prev => [...prev, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const canProceed = uploadedPhotos.length >= 1

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload Photos</h3>
        <p className="text-gray-600">
          Take 1-2 photos that will be integrated into your quest puzzles.
          These could be family photos, pets, or interesting objects in your house.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Click to upload photos
              </p>
              <p className="text-gray-600">
                PNG, JPG up to 10MB each
              </p>
            </label>
          </div>

          {uploadedPhotos.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Uploaded Photos ({uploadedPhotos.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{uploadedPhotos.length}</span> photo(s) uploaded
          </div>
          {canProceed && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Ready to proceed
            </div>
          )}
        </div>

        <Button
          onClick={onComplete}
          disabled={!canProceed || isCompleted}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCompleted ? 'Completed' : 'Complete Step'}
        </Button>
      </div>
    </div>
  )
}