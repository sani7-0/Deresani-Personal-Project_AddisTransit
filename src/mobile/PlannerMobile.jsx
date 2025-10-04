"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Navigation, Clock, Route } from "lucide-react"
import { planTrip, fetchNearbyStops, fetchRoutesWithStops, fetchBusStatus } from "../lib/api"

export default function PlannerMobile({ darkMode, setDarkMode }) {
  const [fromQuery, setFromQuery] = useState("")
  const [toQuery, setToQuery] = useState("")
  const [tripResults, setTripResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [fromSuggestions, setFromSuggestions] = useState([])
  const [toSuggestions, setToSuggestions] = useState([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)

  // Popular locations in Addis Ababa (matching actual database routes)
  const popularLocations = [
    { name: "Bole Medhanealem", lat: 8.9806, lng: 38.7578, type: "landmark" },
    { name: "Meskel Square", lat: 9.0054, lng: 38.7636, type: "landmark" },
    { name: "Mexico Square", lat: 9.0136, lng: 38.7500, type: "landmark" },
    { name: "Piazza", lat: 9.0333, lng: 38.7500, type: "landmark" },
    { name: "CMC", lat: 9.0167, lng: 38.7333, type: "hospital" },
    { name: "Arat Kilo", lat: 9.0333, lng: 38.7500, type: "landmark" },
    { name: "Kazanchis", lat: 9.0167, lng: 38.7500, type: "business" },
    { name: "Merkato", lat: 9.0167, lng: 38.7333, type: "market" },
    { name: "Addis Ababa Airport", lat: 8.9779, lng: 38.7993, type: "airport" },
    { name: "Megenagna", lat: 9.0054, lng: 38.7892, type: "business" },
    { name: "Kara", lat: 9.0356, lng: 38.7528, type: "business" }
  ]

  // Search functionality
  const handleFromSearch = (query) => {
    setFromQuery(query)
    if (query.length > 0) {
      const filtered = popularLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase())
      )
      setFromSuggestions(filtered)
      setShowFromSuggestions(true)
    } else {
      setShowFromSuggestions(false)
    }
  }

  const handleToSearch = (query) => {
    setToQuery(query)
    if (query.length > 0) {
      const filtered = popularLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase())
      )
      setToSuggestions(filtered)
      setShowToSuggestions(true)
    } else {
      setShowToSuggestions(false)
    }
  }

  const selectLocation = (location, type) => {
    if (type === 'from') {
      setFromQuery(location.name)
      setShowFromSuggestions(false)
    } else {
      setToQuery(location.name)
      setShowToSuggestions(false)
    }
  }

  const handlePlanTrip = async () => {
    if (!fromQuery.trim() || !toQuery.trim()) return
    
    setLoading(true)
    try {
      // Find selected locations
      const fromLocation = popularLocations.find(loc => loc.name === fromQuery)
      const toLocation = popularLocations.find(loc => loc.name === toQuery)
      
      if (!fromLocation || !toLocation) {
        throw new Error('Location not found')
      }

      // Get nearby stops for both locations
      const fromStops = await fetchNearbyStops(fromLocation.lat, fromLocation.lng, 1000)
      const toStops = await fetchNearbyStops(toLocation.lat, toLocation.lng, 1000)
      
      // Get routes and buses for detailed planning
      const routes = await fetchRoutesWithStops()
      const buses = await fetchBusStatus()
      
      // Calculate distance and walking time
      const distance = calculateDistance(fromLocation.lat, fromLocation.lng, toLocation.lat, toLocation.lng)
      const walkingTime = Math.ceil(distance * 12) // 12 minutes per km
      
      // Create detailed trip results
      const tripResults = []
      
      // Find routes that actually connect the locations
      const connectingRoutes = routes.filter(route => {
        if (!route.stops || route.stops.length === 0) return false
        
        // Check if route has stops near both locations
        const hasFromStop = route.stops.some(stop => 
          calculateDistance(stop.lat, stop.lng, fromLocation.lat, fromLocation.lng) < 1.0 // Within 1km
        )
        const hasToStop = route.stops.some(stop => 
          calculateDistance(stop.lat, stop.lng, toLocation.lat, toLocation.lng) < 1.0 // Within 1km
        )
        
        return hasFromStop && hasToStop
      })
      
      console.log('Found connecting routes:', connectingRoutes.length)
      
      // If no direct routes, find routes that go through common stops
      if (connectingRoutes.length === 0) {
        // Find routes that go through Mexico Square (common hub)
        const hubRoutes = routes.filter(route => {
          if (!route.stops || route.stops.length === 0) return false
          return route.stops.some(stop => 
            stop.name.toLowerCase().includes('mexico') || 
            stop.name.toLowerCase().includes('meskel')
          )
        })
        
        console.log('Found hub routes:', hubRoutes.length)
        
        // Create trip with transfer
        for (const route of hubRoutes.slice(0, 2)) {
          const routeBuses = buses.filter(bus => String(bus.route_id) === String(route.id))
          const busType = routeBuses[0]?.bus_type || 'City Bus'
          const mengedCompatible = routeBuses[0]?.menged_compatible || false
          
          // Calculate trip duration with transfer
          const busDuration = Math.ceil(distance * 2.5) // 2.5 minutes per km by bus
          const transferTime = 5 // 5 minutes for transfer
          const totalDuration = walkingTime + busDuration + transferTime
          
          tripResults.push({
            id: route.id,
            route: route.short_name || route.shortName,
            color: route.color || '#3B82F6',
            duration: `${totalDuration} min`,
            busDuration: `${busDuration} min`,
            walkingTime: `${walkingTime} min`,
            transfers: 1,
            cost: 'Free',
            busType: busType,
            mengedCompatible: mengedCompatible,
            operator: routeBuses[0]?.operator || 'Sheger',
            steps: [
              `Walk ${walkingTime} min to ${fromStops[0]?.name || 'nearest stop'}`,
              `Take ${route.short_name || route.shortName} (${busType}) to Mexico Square`,
              `Transfer to another route (5 min wait)`,
              `Walk 2 min to ${toLocation.name}`
            ],
            fromStop: fromStops[0]?.name || 'Nearest Stop',
            toStop: 'Mexico Square',
            busCount: routeBuses.length,
            nextBus: routeBuses[0]?.eta_minutes ? `${routeBuses[0].eta_minutes} min` : 'N/A'
          })
        }
      } else {
        // Direct routes found
        for (const route of connectingRoutes.slice(0, 3)) {
          const routeBuses = buses.filter(bus => String(bus.route_id) === String(route.id))
          const busType = routeBuses[0]?.bus_type || 'City Bus'
          const mengedCompatible = routeBuses[0]?.menged_compatible || false
          
          // Calculate trip duration
          const busDuration = Math.ceil(distance * 2.5) // 2.5 minutes per km by bus
          const totalDuration = walkingTime + busDuration
          
          tripResults.push({
            id: route.id,
            route: route.short_name || route.shortName,
            color: route.color || '#3B82F6',
            duration: `${totalDuration} min`,
            busDuration: `${busDuration} min`,
            walkingTime: `${walkingTime} min`,
            transfers: 0,
            cost: 'Free',
            busType: busType,
            mengedCompatible: mengedCompatible,
            operator: routeBuses[0]?.operator || 'Sheger',
            steps: [
              `Walk ${walkingTime} min to ${fromStops[0]?.name || 'nearest stop'}`,
              `Take ${route.short_name || route.shortName} (${busType}) to ${toStops[0]?.name || 'destination'}`,
              `Walk 2 min to ${toLocation.name}`
            ],
            fromStop: fromStops[0]?.name || 'Nearest Stop',
            toStop: toStops[0]?.name || 'Destination Stop',
            busCount: routeBuses.length,
            nextBus: routeBuses[0]?.eta_minutes ? `${routeBuses[0].eta_minutes} min` : 'N/A'
          })
        }
      }
      
      // If no routes found, add a sample route for demonstration using actual route data
      if (tripResults.length === 0) {
        const sampleRoute = routes[0] // Use first available route
        if (sampleRoute) {
          tripResults.push({
            id: sampleRoute.id,
            route: sampleRoute.short_name || sampleRoute.shortName || '1',
            color: sampleRoute.color || '#1e40af',
            duration: `${walkingTime + 25} min`,
            busDuration: '25 min',
            walkingTime: `${walkingTime} min`,
            transfers: 0,
            cost: 'Free',
            busType: 'City Bus',
            mengedCompatible: true,
            operator: 'Sheger',
            steps: [
              `Walk ${walkingTime} min to ${fromStops[0]?.name || 'nearest stop'}`,
              `Take Route ${sampleRoute.short_name || sampleRoute.shortName} (City Bus) to ${toStops[0]?.name || 'destination'}`,
              `Walk 2 min to ${toLocation.name}`
            ],
            fromStop: fromStops[0]?.name || 'Nearest Stop',
            toStop: toStops[0]?.name || 'Destination Stop',
            busCount: buses.filter(bus => String(bus.route_id) === String(sampleRoute.id)).length,
            nextBus: '5 min'
          })
        }
      }
      
      console.log('Trip results generated:', tripResults)
      setTripResults(tripResults)
      setShowResults(true)
    } catch (error) {
      console.error('Trip planning error:', error)
      setTripResults([])
      setShowResults(true) // Still show results section even if empty
    }
    setLoading(false)
  }

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="safe-screen px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Planner</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plan your journey</p>
          </div>
        </div>

        {/* Search Form */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="From (e.g., Meskel Square, Bole Airport)"
              value={fromQuery}
              onChange={(e) => handleFromSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* From Suggestions */}
            <AnimatePresence>
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-48 overflow-y-auto"
                >
                  {fromSuggestions.map((location, idx) => (
                    <motion.button
                      key={location.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => selectLocation(location, 'from')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-blue-500">
                        {location.type === 'airport' ? '✈️' : 
                         location.type === 'hospital' ? '🏥' :
                         location.type === 'market' ? '🏪' :
                         location.type === 'business' ? '🏢' :
                         location.type === 'residential' ? '🏠' : '📍'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{location.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{location.type}</div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Navigation className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="To (e.g., Piazza, Merkato)"
              value={toQuery}
              onChange={(e) => handleToSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* To Suggestions */}
            <AnimatePresence>
              {showToSuggestions && toSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-48 overflow-y-auto"
                >
                  {toSuggestions.map((location, idx) => (
                    <motion.button
                      key={location.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => selectLocation(location, 'to')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-green-500">
                        {location.type === 'airport' ? '✈️' : 
                         location.type === 'hospital' ? '🏥' :
                         location.type === 'market' ? '🏪' :
                         location.type === 'business' ? '🏢' :
                         location.type === 'residential' ? '🏠' : '📍'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{location.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{location.type}</div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handlePlanTrip}
            disabled={loading || !fromQuery.trim() || !toQuery.trim()}
            className="w-full py-3 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2ECC71' }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Planning your trip...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                {fromQuery && toQuery ? 'Plan Trip' : 'Select locations first'}
              </div>
            )}
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 overflow-auto px-4 pb-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Trip Options from {fromQuery} to {toQuery}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tripResults.length} route{tripResults.length !== 1 ? 's' : ''} found
                </div>
              </div>
              <motion.button
                onClick={() => setShowResults(false)}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                whileTap={{ scale: 0.95 }}
              >
                Clear
              </motion.button>
            </div>
            <div className="space-y-3">
              {tripResults.length > 0 ? (
                tripResults.map((trip, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                  >
                    {/* Trip Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{ backgroundColor: trip.color || '#3B82F6' }}>
                        {trip.route || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{trip.duration}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{trip.transfers} transfers • {trip.cost}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Next bus</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{trip.nextBus}</div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Walking Time</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{trip.walkingTime}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Route className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bus Duration</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{trip.busDuration}</div>
                      </div>
                    </div>

                    {/* Bus Information */}
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-100">{trip.busType}</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Operator: {trip.operator}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-blue-700 dark:text-blue-300">Menged Compatible</div>
                          <div className={`text-lg font-bold ${trip.mengedCompatible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {trip.mengedCompatible ? '✓ Yes' : '✗ No'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        {trip.busCount} buses available
                      </div>
                    </div>

                    {/* Trip Steps */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Route Details</h4>
                      {trip.steps?.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{step}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <div className="font-medium mb-2">No routes found</div>
                  <div className="text-sm mb-4">We couldn't find any routes between these locations</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Try selecting different locations from the suggestions above
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}














