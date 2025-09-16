'use client'

import { useState, useEffect } from 'react'
import { getStations, createStation, updateStation, deleteStation } from '@/lib/supabase-direct'
import { Station, StationRoute } from '@/types'
import { Plus, Edit, Trash2, QrCode, Save, X } from 'lucide-react'
import QRCode from 'qrcode'

interface EditingStation extends Station {
  isNew?: boolean
}

export default function AdminPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [editingStation, setEditingStation] = useState<EditingStation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStations()
  }, [])

  const loadStations = async () => {
    try {
      const data = await getStations()
      setStations(data || [])
    } catch (error) {
      console.error('Error loading stations:', error)
      setError('Failed to load stations')
    }
  }

  const handleSaveStation = async () => {
    if (!editingStation) return

    setLoading(true)
    setError('')

    try {
      const stationData = {
        id: editingStation.id,
        name: editingStation.name,
        routes: editingStation.routes
      }

      if (editingStation.isNew) {
        await createStation(stationData)
      } else {
        await updateStation(editingStation.id, stationData)
      }

      await loadStations()
      setEditingStation(null)
    } catch (error: any) {
      setError(error.message || 'Failed to save station')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStation = async (stationId: string) => {
    if (!confirm('Are you sure you want to delete this station?')) return

    setLoading(true)
    try {
      await deleteStation(stationId)
      await loadStations()
    } catch (error: any) {
      setError(error.message || 'Failed to delete station')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (stationId: string) => {
    try {
      const url = `${window.location.origin}/?station=${stationId}`
      const qrDataUrl = await QRCode.toDataURL(url, { width: 300 })
      
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `station-${stationId}-qr.png`
      link.click()
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Failed to generate QR code')
    }
  }

  const createNewStation = () => {
    setEditingStation({
      id: '',
      name: '',
      routes: {},
      isNew: true
    })
  }

  const addRoute = () => {
    if (!editingStation) return
    
    const routeKey = `ROUTE_${Object.keys(editingStation.routes).length + 1}`
    setEditingStation({
      ...editingStation,
      routes: {
        ...editingStation.routes,
        [routeKey]: {
          nextStation: '',
          password: '',
          nextClue: '',
          videoUrl: ''
        }
      }
    })
  }

  const updateRoute = (routeKey: string, field: keyof StationRoute, value: string) => {
    if (!editingStation) return
    
    setEditingStation({
      ...editingStation,
      routes: {
        ...editingStation.routes,
        [routeKey]: {
          ...editingStation.routes[routeKey],
          [field]: value
        }
      }
    })
  }

  const removeRoute = (routeKey: string) => {
    if (!editingStation) return
    
    const newRoutes = { ...editingStation.routes }
    delete newRoutes[routeKey]
    
    setEditingStation({
      ...editingStation,
      routes: newRoutes
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
          <button
            onClick={createNewStation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Station
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stations.map((station) => (
            <div key={station.id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{station.name}</h3>
                  <p className="text-sm text-gray-500">ID: {station.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateQRCode(station.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Generate QR Code"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingStation(station)}
                    className="text-green-600 hover:text-green-800"
                    title="Edit Station"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteStation(station.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Station"
                    disabled={loading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Routes: {Object.keys(station.routes).length}</p>
                <div className="space-y-1">
                  {Object.entries(station.routes).map(([key, route]) => (
                    <div key={key} className="text-xs bg-gray-50 p-2 rounded">
                      <strong>{key}:</strong> → {route.nextStation}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingStation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingStation.isNew ? 'Create New Station' : `Edit ${editingStation.name}`}
                </h2>
                <button
                  onClick={() => setEditingStation(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Station ID
                      </label>
                      <input
                        type="text"
                        value={editingStation.id}
                        onChange={(e) => setEditingStation({...editingStation, id: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., STATION1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Station Name
                      </label>
                      <input
                        type="text"
                        value={editingStation.name}
                        onChange={(e) => setEditingStation({...editingStation, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Main Entrance"
                      />
                    </div>
                  </div>

                  {/* Routes */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Routes</h3>
                      <button
                        onClick={addRoute}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Route
                      </button>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(editingStation.routes).map(([routeKey, route]) => (
                        <div key={routeKey} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900">Route: {routeKey}</h4>
                            <button
                              onClick={() => removeRoute(routeKey)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                              </label>
                              <input
                                type="text"
                                value={route.password}
                                onChange={(e) => updateRoute(routeKey, 'password', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Team password"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Next Station
                              </label>
                              <input
                                type="text"
                                value={route.nextStation}
                                onChange={(e) => updateRoute(routeKey, 'nextStation', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Next station ID"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Next Clue
                              </label>
                              <textarea
                                value={route.nextClue}
                                onChange={(e) => updateRoute(routeKey, 'nextClue', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                placeholder="Clue for next location"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video URL
                              </label>
                              <input
                                type="url"
                                value={route.videoUrl}
                                onChange={(e) => updateRoute(routeKey, 'videoUrl', e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Google Drive video URL"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStation}
                  disabled={loading || !editingStation.id || !editingStation.name}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Station
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}