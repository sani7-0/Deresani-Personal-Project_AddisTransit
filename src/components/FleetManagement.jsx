import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bus, MapPin, Send, RefreshCw, AlertTriangle, Users, Clock } from 'lucide-react'
import CongestionHeatmap from './CongestionHeatmap'
import { fetchBusStatus, sendRerouteCommand, fetchCongestionData, fetchRouteCongestion, sendRerouteToRoute } from '../lib/api'

const FleetManagement = () => {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [availableBuses, setAvailableBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [congestionData, setCongestionData] = useState([])
  const [routeCongestion, setRouteCongestion] = useState([])
  const [selectedTargetRoute, setSelectedTargetRoute] = useState(null)

  // Load top congested routes from DB
  const loadRouteCongestion = async () => {
    try {
      const res = await fetchRouteCongestion()
      if (res.success) {
        setRouteCongestion(res.routes)
      }
    } catch (e) {
      console.error('Failed to load route congestion', e)
    }
  }

  useEffect(() => {
    loadBusStatus()
    loadCongestionData()
    loadRouteCongestion()
  }, [])

  const loadBusStatus = async () => {
    try {
      const data = await fetchBusStatus()
      // Filter buses that are available for rerouting (not at full capacity)
      const available = data.filter(bus => 
        bus.status !== 'red' && 
        (bus.passengers / bus.max_capacity) < 0.8
      )
      setAvailableBuses(available)
    } catch (error) {
      console.error('Failed to load bus status:', error)
    }
  }

  const loadCongestionData = async () => {
    try {
      const response = await fetchCongestionData()
      if (response.success) {
        setCongestionData(response.data)
      }
    } catch (error) {
      console.error('Failed to load congestion data:', error)
      // Fallback to mock data if API fails
      generateMockCongestionData()
    }
  }

  const generateMockCongestionData = () => {
    // Fallback mock AI congestion predictions
    const areas = [
      { area: 'Meskel Square', lng: 38.7756, lat: 9.0192, intensity: 0.9, passengers: 150 },
      { area: 'CMC', lng: 38.7600, lat: 9.0100, intensity: 0.7, passengers: 120 },
      { area: 'Bole', lng: 38.7900, lat: 9.0300, intensity: 0.8, passengers: 140 },
      { area: 'Piazza', lng: 38.7500, lat: 9.0000, intensity: 0.6, passengers: 100 },
      { area: 'Kazanchis', lng: 38.7800, lat: 9.0400, intensity: 0.5, passengers: 80 },
      { area: 'Merkato', lng: 38.7400, lat: 8.9900, intensity: 0.4, passengers: 60 },
      { area: 'Airport', lng: 38.8000, lat: 9.0500, intensity: 0.3, passengers: 40 },
      { area: 'Arat Kilo', lng: 38.7200, lat: 8.9800, intensity: 0.2, passengers: 30 }
    ]
    setCongestionData(areas)
  }

  const handleLocationClick = (location) => {
    setSelectedLocation(location)
    setMessage('')
  }

  const handleSendBus = async () => {
    if (!selectedBus) {
      setMessage('Please select a bus')
      return
    }
    setIsLoading(true)
    try {
      let response
      if (selectedTargetRoute) {
        response = await sendRerouteToRoute(
          selectedBus.bus_id,
          selectedTargetRoute.route_id,
          `Move to congested route ${selectedTargetRoute.short_name}`,
          'high',
          selectedBus.plate_number,
          selectedTargetRoute.short_name,
          selectedTargetRoute.name
        )
        // No manual retry needed; backend now accepts short/name in a single request
      } else if (selectedLocation) {
        response = await sendRerouteCommand(
          selectedBus.bus_id,
          { name: selectedLocation.area, lng: selectedLocation.lng, lat: selectedLocation.lat },
          `High passenger demand detected at ${selectedLocation.area}`,
          selectedLocation.intensity > 0.7 ? 'high' : 'medium'
        )
      } else {
        setMessage('Select a target route or a location')
        setIsLoading(false)
        return
      }

      if (response.success) {
        setMessage(`✅ Bus ${selectedBus.plate_number} has been reassigned`)
        setSelectedBus(null)
        setSelectedLocation(null)
        setSelectedTargetRoute(null)
        await loadBusStatus()
        await loadRouteCongestion()
      } else {
        setMessage(`❌ Error: ${response.error || 'Failed to send reroute command'}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getCongestionColor = (intensity) => {
    if (intensity >= 0.8) return 'text-red-600 bg-red-100'
    if (intensity >= 0.6) return 'text-orange-600 bg-orange-100'
    if (intensity >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getCongestionLabel = (intensity) => {
    if (intensity >= 0.8) return 'Critical'
    if (intensity >= 0.6) return 'High'
    if (intensity >= 0.4) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-6 bg-green-50/40 dark:bg-gray-900/60 rounded-3xl p-4">
      {/* Header */}
      <div className="rounded-3xl border border-green-200 dark:border-green-900/40 bg-white/90 dark:bg-gray-900/70 shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Fleet Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered congestion prediction and bus rerouting system
            </p>
          </div>
          <button
            onClick={loadBusStatus}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold shadow"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* AI Congestion Heatmap */}
        <div className="mb-6 rounded-2xl overflow-hidden border border-green-100 dark:border-green-900/40">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            AI Congestion Predictions
          </h3>
          <CongestionHeatmap 
            congestionData={congestionData}
            onLocationClick={handleLocationClick}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* DB Route Congestion Tiles (Top 5) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Congested Routes (from DB)</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {routeCongestion.map((r, index) => (
              <motion.div
                key={r.route_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedTargetRoute?.route_id === r.route_id
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'hover:shadow-md border-green-200/60 dark:border-green-900/40'
                }`}
                onClick={() => { setSelectedTargetRoute(r); setSelectedLocation(null); setMessage(''); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{r.short_name} — {r.name}</h4>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {r.load_percentage}%
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div>Buses: {r.buses}</div>
                  <div>Passengers: {r.passengers}/{r.capacity}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bus Selection and Rerouting */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Buses */}
        <div className="rounded-3xl border border-green-200 dark:border-green-900/40 bg-white/90 dark:bg-gray-900/70 shadow-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-500" />
            Available Buses ({availableBuses.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableBuses.map((bus) => (
              <motion.div
                key={bus.bus_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedBus?.bus_id === bus.bus_id
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'hover:shadow-md border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setSelectedBus(bus)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bus.status_emoji}</span>
                    <span className="font-semibold">{bus.plate_number}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bus.status === 'green' ? 'bg-green-100 text-green-700' :
                    bus.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {bus.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Route: {bus.route_short_name} - {bus.route_name}</div>
                  <div>Passengers: {bus.passengers}/{bus.max_capacity} ({bus.fullness_percentage}%)</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rerouting Actions */}
        <div className="rounded-3xl border border-green-200 dark:border-green-900/40 bg-white/90 dark:bg-gray-900/70 shadow-xl p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-500" />
            Send Bus (to route or location)
          </h3>

          {/* Route selection now happens via tiles under the map. */}
          
          {selectedLocation && !selectedTargetRoute && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  Selected: {selectedLocation.area}
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div>Congestion: {Math.round(selectedLocation.intensity * 100)}%</div>
                <div>Expected Passengers: {selectedLocation.passengers}</div>
              </div>
            </div>
          )}

          {selectedTargetRoute && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <div className="font-semibold">Target Route: {selectedTargetRoute.short_name} — {selectedTargetRoute.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Load: {selectedTargetRoute.load_percentage}%</div>
            </div>
          )}

          {selectedBus && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <Bus className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Selected: {selectedBus.plate_number}
                </span>
              </div>
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                <div>Route: {selectedBus.route_short_name}</div>
                <div>Capacity: {selectedBus.passengers}/{selectedBus.max_capacity}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleSendBus}
            disabled={!selectedBus || (!selectedTargetRoute && !selectedLocation) || isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Bus to Location
              </>
            )}
          </button>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
            >
              {message}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FleetManagement
