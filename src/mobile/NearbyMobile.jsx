"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Navigation, RefreshCw, Clock, Footprints } from "lucide-react"
import { fetchNearbyStops } from "../lib/api"

export default function NearbyMobile({ darkMode, setDarkMode, user }) {
  const [nearbyStops, setNearbyStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState({ lat: 9.0054, lng: 38.7636 })
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [locationError, setLocationError] = useState('')

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(newLocation)
        loadNearbyStops(newLocation)
      },
      (error) => {
        console.error('Error getting location:', error)
        setLocationError('Unable to get your location. Using default location.')
        loadNearbyStops()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const loadNearbyStops = async (location = userLocation) => {
    setLoading(true)
    try {
      const stops = await fetchNearbyStops(location.lat, location.lng, 1200)
      const mapped = (stops || []).map((s) => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        routeId: s.route_id,
        routeName: s.route_name,
        routeShortName: s.route_short_name,
        routeColor: s.route_color,
        nextArrivals: ["3 min", "13 min", "23 min"], // Mock arrivals since backend doesn't provide this yet
        distance: (s.meters || 0) / 1000,
        walkingTime: Math.ceil(((s.meters || 0) / 1000) * 12),
      }))
      setNearbyStops(mapped)
    } catch (_e) {
      console.error('Error loading nearby stops:', _e)
      setNearbyStops([])
    }
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    // Try to get user's actual location first
    getUserLocation()
    
    // Set up interval to refresh stops every 30 seconds
    const interval = setInterval(() => {
      loadNearbyStops()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="safe-screen px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nearby Stops</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locationError ? 'Using default location' : 'Stops around you'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={getUserLocation}
              disabled={loading}
              className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Navigation className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${loading ? "animate-spin" : ""}`} />
            </motion.button>
            <motion.button
              onClick={() => loadNearbyStops()}
              disabled={loading}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? "animate-spin" : ""}`} />
            </motion.button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Stops List */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading nearby stops...</span>
          </div>
        ) : nearbyStops.length > 0 ? (
          <div className="space-y-3">
            {nearbyStops.map((stop, index) => (
              <motion.div
                key={`${stop.id}-${stop.routeId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Stop Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: stop.routeColor }}
                      >
                        {stop.routeShortName}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{stop.name}</h3>
                        <p className="text-sm text-gray-500">{stop.routeName}</p>
                      </div>
                    </div>

                    {/* Distance and Walking Time */}
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{stop.distance.toFixed(1)} km away</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Footprints className="w-4 h-4" />
                        <span>{stop.walkingTime} min walk</span>
                      </div>
                    </div>

                    {/* Arrival Times */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Next Arrivals</h4>
                      <div className="flex space-x-3">
                        {stop.nextArrivals.slice(0, 3).map((arrival, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              idx === 0
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {arrival}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Direction Arrow */}
                  <motion.button 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Navigation className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No stops found</h3>
            <p className="text-gray-500 text-center">No nearby stops available</p>
          </div>
        )}
      </div>
    </div>
  )
}














