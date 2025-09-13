"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Search, Navigation, Clock, Users, ArrowUpDown, History, Home } from "lucide-react"
import RouteCard from "./RouteCard"
import { useEffect as useEffectReact } from "react"
import { useNavigate } from "react-router-dom"
import { fetchRoutesWithStops, fetchEthiopianBuses, fetchBusStatus } from "../lib/api"

const Sidebar = ({ isOpen, onToggle, selectedRoute, onRouteSelect }) => {
  const navigate = useNavigate()
  const [fromLocation, setFromLocation] = useState("Current location")
  const [toLocation, setToLocation] = useState("")
  const [searchFocused, setSearchFocused] = useState(null)
  const [nearbyRoutes, setNearbyRoutes] = useState([])
  const [recentSearches] = useState(["Great Theatre", "Athens Chapel", "Puck's Pharmacy", "Shakespeare Ave"])

  // Ethiopian location suggestions
  const ethiopianLocations = [
    { name: "Meskel Square", lat: 9.0054, lng: 38.7636, type: "landmark" },
    { name: "Piazza", lat: 9.0154, lng: 38.7736, type: "landmark" },
    { name: "CMC Terminal", lat: 9.0254, lng: 38.7836, type: "terminal" },
    { name: "Bole Airport", lat: 8.9954, lng: 38.7536, type: "airport" },
    { name: "Kazanchis", lat: 9.0054, lng: 38.7436, type: "area" },
    { name: "Merkato", lat: 8.9854, lng: 38.7236, type: "market" },
    { name: "Arat Kilo", lat: 9.0154, lng: 38.7536, type: "area" },
    { name: "National Theatre", lat: 9.0054, lng: 38.7436, type: "landmark" },
    { name: "Addis Ababa University", lat: 9.0054, lng: 38.7636, type: "university" },
    { name: "Ethiopian Airlines", lat: 8.9954, lng: 38.7536, type: "office" },
    { name: "Sheraton Addis", lat: 9.0054, lng: 38.7636, type: "hotel" },
    { name: "Unity Park", lat: 9.0054, lng: 38.7636, type: "park" },
    { name: "Entoto Park", lat: 9.0254, lng: 38.7836, type: "park" },
    { name: "Lion of Judah", lat: 9.0054, lng: 38.7636, type: "monument" },
    { name: "Red Terror Martyrs Memorial", lat: 9.0054, lng: 38.7636, type: "memorial" }
  ]

  // Filter locations based on search input
  const filteredLocations = (query, field) => {
    if (!query || query.length < 1) return []
    const searchTerm = query.toLowerCase()
    return ethiopianLocations
      .filter(loc => loc.name.toLowerCase().includes(searchTerm))
      .slice(0, 5) // Limit to 5 suggestions
      .map(loc => loc.name)
  }

  // Get live bus data from simulation
  const [activeByRoute, setActiveByRoute] = useState({})
  const [busStatusData, setBusStatusData] = useState([])
  const getRouteBusData = (routeId) => activeByRoute[routeId] || { activeBuses: 0, nextArrival: "--" }
  
  // Get bus status data (passenger counts, capacity, status)
  const getBusStatusForRoute = (routeId) => {
    return busStatusData.filter(bus => bus.route_id === routeId)
  }

  const swapLocations = () => {
    const temp = fromLocation
    setFromLocation(toLocation)
    setToLocation(temp)
  }

  const handleGoToTripPlanner = () => {
    // Find coordinates for the locations
    const fromLocationData = ethiopianLocations.find(loc => 
      loc.name.toLowerCase().includes(fromLocation.toLowerCase())
    )
    const toLocationData = ethiopianLocations.find(loc => 
      loc.name.toLowerCase().includes(toLocation.toLowerCase())
    )

    // Navigate to trip planner with location data
    navigate('/trip-planner', {
      state: {
        from: fromLocationData || { name: fromLocation, lat: 9.0054, lng: 38.7636 },
        to: toLocationData || { name: toLocation, lat: 9.0154, lng: 38.7736 }
      }
    })
  }

  useEffectReact(() => {
    fetchRoutesWithStops().then(setNearbyRoutes).catch(() => setNearbyRoutes([]))
    
    // Fetch bus status data (passenger counts, capacity, status)
    const loadBusStatus = async () => {
      try {
        const statusData = await fetchBusStatus()
        setBusStatusData(statusData)
      } catch (error) {
        console.error('Failed to fetch bus status:', error)
      }
    }
    
    // Load bus status immediately and then every 30 seconds
    loadBusStatus()
    const statusInterval = setInterval(loadBusStatus, 30000)
    
    // Keep the simulation data for bus positions
    const interval = setInterval(async () => {
      try {
        const buses = await fetchEthiopianBuses()
        // Group by route
        const grouped = buses.reduce((acc, b) => {
          acc[b.routeId] = acc[b.routeId] || []
          acc[b.routeId].push(b)
          return acc
        }, {})
        const summary = Object.fromEntries(
          Object.entries(grouped).map(([routeId, list]) => [
            routeId,
            {
              activeBuses: list.length,
              nextArrival: `${Math.max(1, 2 + Math.floor(Math.random() * 6))} min`,
            },
          ])
        )
        setActiveByRoute(summary)
      } catch (_e) {
        // ignore
      }
    }, 5000)
    
    return () => {
      clearInterval(interval)
      clearInterval(statusInterval)
    }
  }, [])

  return (
    <>
      {/* Sidebar */}
      <motion.div
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col"
        initial={false}
        animate={{
          width: isOpen ? 400 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
          opacity: { duration: isOpen ? 0.3 : 0.1 },
        }}
        style={{ overflow: "auto" }}
      >
        <div className="w-80 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Navigation className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Transit</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time tracking</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Plan Your Trip</h2>

            <div className="space-y-4">
              {/* From Input */}
              <div className="relative">
                <div
                  className={`flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border transition-colors ${
                    searchFocused === "from"
                      ? "border-primary-500 bg-white dark:bg-gray-700"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="From"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    onFocus={() => setSearchFocused("from")}
                    onBlur={() => setSearchFocused(null)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <Home className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={swapLocations}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* To Input */}
              <div className="relative">
                <div
                  className={`flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border transition-colors ${
                    searchFocused === "to"
                      ? "border-primary-500 bg-white dark:bg-gray-700"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="To"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    onFocus={() => setSearchFocused("to")}
                    onBlur={() => setSearchFocused(null)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <Search className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>

              {/* GO Button */}
              {fromLocation && toLocation && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleGoToTripPlanner}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors text-lg"
                >
                  GO
                </motion.button>
              )}

              {/* Search Suggestions */}
              <AnimatePresence>
                {searchFocused && (fromLocation || toLocation) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
                  >
                    <div className="p-2">
                      {/* Show Ethiopian location suggestions when typing */}
                      {((searchFocused === "from" && fromLocation && fromLocation !== "Current location") || 
                        (searchFocused === "to" && toLocation)) ? (
                        filteredLocations(searchFocused === "from" ? fromLocation : toLocation, searchFocused).map((location, index) => {
                          const locationData = ethiopianLocations.find(loc => loc.name === location)
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (searchFocused === "from") {
                                  setFromLocation(location)
                                } else {
                                  setToLocation(location)
                                }
                                setSearchFocused(null)
                              }}
                              className="w-full flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                            >
                              <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm text-gray-900 dark:text-gray-100">{location}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">{locationData?.type}</span>
                              </div>
                            </button>
                          )
                        })
                      ) : (
                        /* Show recent searches when not typing */
                        recentSearches.slice(0, 3).map((search, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (searchFocused === "from") {
                                setFromLocation(search)
                              } else {
                                setToLocation(search)
                              }
                              setSearchFocused(null)
                            }}
                            className="w-full flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                          >
                            <History className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{search}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {selectedRoute ? (
              /* Selected Route Details */
              <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => onRouteSelect(null)}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  >
                    ← Back to routes
                  </button>
                </div>

                {/* Route Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                    style={{ backgroundColor: selectedRoute.color }}
                  >
                    {selectedRoute.shortName}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedRoute.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRoute.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Arrival</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {getRouteBusData(selectedRoute.id).nextArrival.replace(" min", "")}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">minutes</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Buses</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {getRouteBusData(selectedRoute.id).activeBuses}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">buses</div>
                  </div>
                </div>

                {/* Bus Status Section */}
                {getBusStatusForRoute(selectedRoute.id).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Bus Status ({getBusStatusForRoute(selectedRoute.id).length})
                    </h4>
                    <div className="space-y-2">
                      {getBusStatusForRoute(selectedRoute.id).map((bus) => (
                        <div key={bus.bus_id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{bus.status_emoji}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {bus.plate_number}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bus.status === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                              bus.status === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            }`}>
                              {bus.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Passengers: {bus.passengers}/{bus.max_capacity}</span>
                            <span>{bus.fullness_percentage}% full</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                bus.status === 'green' ? 'bg-green-500' :
                                bus.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(bus.fullness_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stops List */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Route Stops ({selectedRoute.stops?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {(selectedRoute.stops || []).map((stop, index) => (
                      <div key={stop.id} className="flex items-start space-x-3">
                        <div className="relative mt-2">
                          <div
                            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: selectedRoute.color }}
                          />
                          {index < (selectedRoute.stops?.length || 0) - 1 && (
                            <div
                              className="absolute top-3 left-1/2 w-0.5 h-8 -translate-x-1/2"
                              style={{ backgroundColor: selectedRoute.color, opacity: 0.3 }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {stop.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Stop #{stop.sequence} • {Number(stop.lat)?.toFixed(4)}, {Number(stop.lng)?.toFixed(4)}
                          </div>
                          {/* Mock arrival times for now */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              {Math.max(1, 2 + Math.floor(Math.random() * 6))} min
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {Math.max(8, 10 + Math.floor(Math.random() * 8))} min
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!selectedRoute.stops || selectedRoute.stops.length === 0) && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="text-sm">No stops data available</div>
                        <div className="text-xs mt-1">Check your backend API</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Routes List */
              <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nearby Routes</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{nearbyRoutes.length} routes</span>
                </div>

                <div className="space-y-3">
                  {(nearbyRoutes || []).map((route) => (
                    <div key={route.id} className="transform scale-95">
                      <RouteCard
                        route={route}
                        busData={getRouteBusData(String(route.id))}
                        busStatusData={getBusStatusForRoute(String(route.id))}
                        onClick={() => onRouteSelect(route)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Toggle Button (when sidebar is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={onToggle}
            className="fixed top-20 right-4 z-50 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors lg:flex"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay (for mobile if needed) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
