'use client'

import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  url: string
  onClose: () => void
  translations?: {
    title?: string
    loading?: string
  }
}

export default function VideoPlayer({ url, onClose, translations }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    const getVideoUrl = (url: string) => {
      const fileId = url.match(/[-\w]{25,}/)
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId[0]}/preview`
      }
      return url
    }

    setVideoUrl(getVideoUrl(url))
  }, [url])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{translations?.title || 'Mission Video'}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close video"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              className="w-full h-96 md:h-[500px] rounded"
              allow="autoplay"
              title="Mission Video"
            />
          ) : (
            <div className="w-full h-96 md:h-[500px] bg-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-500">{translations?.loading || 'Loading video...'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}