'use client'

import { useState, useEffect } from 'react'
import { getStations, logTeamVisit } from '@/lib/supabase-direct'
import { Station, StationRoute } from '@/types'
import QRScanner from '@/components/QRScanner'
import VideoPlayer from '@/components/VideoPlayer'
import LanguageToggle from '@/components/LanguageToggle'
import { Camera, Lock, MapPin, Play } from 'lucide-react'
import { Language, useTranslation } from '@/lib/i18n'

export default function HomePage() {
  const [password, setPassword] = useState('')
  const [showVideo, setShowVideo] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [currentStation, setCurrentStation] = useState<Station | null>(null)
  const [matchingRoute, setMatchingRoute] = useState<StationRoute | null>(null)
  const [stations, setStations] = useState<Record<string, Station>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  
  const { t, isRTL } = useTranslation(language)

  useEffect(() => {
    loadStations()
  }, [])

  // Separate effect to handle URL parameter after stations are loaded
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    let stationId = urlParams.get('station')
    console.log('URL station parameter:', stationId)
    console.log('Full URL:', window.location.href)
    
    if (stationId && Object.keys(stations).length > 0) {
      // Clean up the station ID (remove extra spaces, decode if needed)
      stationId = decodeURIComponent(stationId.trim())
      console.log('Cleaned station ID:', stationId)
      console.log('Attempting to load station from URL:', stationId)
      loadStation(stationId)
    }
  }, [stations]) // This runs when stations are loaded

  const loadStations = async () => {
    try {
      const data = await getStations()
      
      const stationsMap = data.reduce((acc: Record<string, Station>, station: Station) => {
        acc[station.id] = station
        return acc
      }, {})
      
      setStations(stationsMap)
    } catch (error) {
      console.error('Error loading stations:', error)
      setError(t('failed.load.stations'))
    }
  }

  const loadStation = (stationId: string) => {
    console.log('Looking for station:', stationId)
    console.log('Available stations:', Object.keys(stations))
    
    // Try exact match first
    let station = stations[stationId]
    
    // If not found, try case-insensitive search
    if (!station) {
      const stationKey = Object.keys(stations).find(key => 
        key.toLowerCase() === stationId.toLowerCase()
      )
      if (stationKey) {
        station = stations[stationKey]
        console.log('Found station with case-insensitive match:', stationKey)
      }
    }
    
    if (station) {
      setCurrentStation(station)
      setError('')
      setPassword('')
      setMatchingRoute(null)
      setShowVideo(false)
      console.log('Station loaded successfully:', station)
    } else {
      console.error('Station not found. Available:', Object.keys(stations), 'Requested:', stationId)
      setError(t('station.not.found'))
    }
  }

  const handleScanSuccess = (stationId: string) => {
    setShowScanner(false)
    loadStation(stationId)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentStation || !password.trim()) return

    setLoading(true)
    setError('')

    try {
      const matchingRoute = Object.values(currentStation.routes).find(
        route => route.password.toUpperCase() === password.toUpperCase()
      )

      if (matchingRoute) {
        setMatchingRoute(matchingRoute)
        setShowVideo(true)
        
        // Log successful team visit
        await logTeamVisit(password, currentStation.id, true)
        console.log('Logged team visit:', password, currentStation.id)
        
        setPassword('')
        
        // Load next station data if available
        if (matchingRoute.nextStation !== 'END' && stations[matchingRoute.nextStation]) {
          // Pre-load next station for smoother experience
        }
      } else {
        // Log failed attempt
        await logTeamVisit(password, currentStation.id, false)
        console.log('Logged failed attempt:', password, currentStation.id)
        setError(t('invalid.password'))
      }
    } catch (error) {
      setError(t('error.occurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClose = () => {
    setShowVideo(false)
  }

  const resetGame = () => {
    setCurrentStation(null)
    setMatchingRoute(null)
    setPassword('')
    setError('')
    setShowVideo(false)
    
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <LanguageToggle currentLanguage={language} onLanguageChange={setLanguage} />
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2">🕵️ {t('spy.mission')}</h1>
          <p className="text-gray-300">{t('decode.infiltrate.complete')}</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          {!currentStation ? (
            /* Landing/Scanner View */
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                  <Camera className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {t('begin.mission')}
                </h2>
                <p className="text-gray-300 text-sm">
                  {t('scan.qr.instruction')}
                </p>
              </div>

              {showScanner ? (
                <div className="space-y-4">
                  <QRScanner 
                    onScanSuccess={handleScanSuccess}
                    onScanError={(error) => {
                      if (error.includes('No station ID found')) {
                        setError(t('invalid.qr.no.station'))
                      } else if (error.includes('Invalid QR code format')) {
                        setError(t('invalid.qr.format'))
                      } else {
                        setError(error)
                      }
                    }}
                  />
                  <button
                    onClick={() => setShowScanner(false)}
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  {t('scan.qr.code')}
                </button>
              )}
            </div>
          ) : (
            /* Station View */
            <div className="space-y-6">
              {/* Station Info */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">
                    {currentStation.name}
                  </h2>
                </div>
                <p className="text-gray-300 text-sm">{t('enter.password')}</p>
              </div>

              {/* Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password.placeholder')}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !password.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t('decode.mission')}
                    </>
                  )}
                </button>
              </form>

              {/* Success State */}
              {matchingRoute && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center animate-fade-in">
                  <h3 className="text-green-400 font-medium mb-2">{t('mission.decoded')}</h3>
                  <p className="text-white text-sm mb-3">{matchingRoute.nextClue}</p>
                  <button
                    onClick={() => setShowVideo(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 mx-auto transition-colors duration-200"
                  >
                    <Play className="w-4 h-4" />
                    {t('watch.briefing')}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  {t('new.station')}
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 bg-gray-600/20 border border-gray-500/30 text-gray-400 hover:bg-gray-600/30 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  {t('reset')}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Scanner Modal */}
        {showScanner && currentStation && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{t('scan.next.station')}</h3>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4">
                <QRScanner 
                  onScanSuccess={handleScanSuccess}
                  onScanError={(error) => {
                    if (error.includes('No station ID found')) {
                      setError(t('invalid.qr.no.station'))
                    } else if (error.includes('Invalid QR code format')) {
                      setError(t('invalid.qr.format'))
                    } else {
                      setError(error)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideo && matchingRoute && (
          <VideoPlayer
            url={matchingRoute.videoUrl}
            onClose={handleVideoClose}
            translations={{
              title: t('mission.video'),
              loading: t('loading.video')
            }}
          />
        )}
      </div>
    </div>
  )
}