"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Navigation, RefreshCw, Filter, Clock, Footprints, Star } from "lucide-react"
import DarkModeToggle from "../components/DarkModeToggle"
import TopBar from "../components/TopBar"
import { fetchNearbyStops, fetchRoutes } from "../lib/api"

const NearbyPage = ({ darkMode, setDarkMode }) => {
  const [nearbyStops, setNearbyStops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [filterRoute, setFilterRoute] = useState("all")
  const [sortBy, setSortBy] = useState("distance")
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState({ lat: 9.0054, lng: 38.7636 }) // Addis Ababa

  // Ethiopian stops data
  const ethiopianStops = [
    { id: "stop-1", name: "Meskel Square", lat: 9.0054, lng: 38.7636, routeId: "route-38", routeName: "Route 38", routeShortName: "38", routeColor: "#1e40af", nextArrivals: ["2 min", "12 min", "22 min"], distance: 0.1, walkingTime: 1 },
    { id: "stop-2", name: "Piazza", lat: 9.0154, lng: 38.7736, routeId: "route-38", routeName: "Route 38", routeShortName: "38", routeColor: "#1e40af", nextArrivals: ["5 min", "15 min", "25 min"], distance: 0.3, walkingTime: 4 },
    { id: "stop-3", name: "CMC Terminal", lat: 9.0254, lng: 38.7836, routeId: "route-38", routeName: "Route 38", routeShortName: "38", routeColor: "#1e40af", nextArrivals: ["8 min", "18 min", "28 min"], distance: 0.5, walkingTime: 6 },
    { id: "stop-4", name: "Bole Airport", lat: 8.9954, lng: 38.7536, routeId: "route-91", routeName: "Route 91", routeShortName: "91", routeColor: "#f59e0b", nextArrivals: ["3 min", "13 min", "23 min"], distance: 0.2, walkingTime: 2 },
    { id: "stop-5", name: "Kazanchis", lat: 9.0054, lng: 38.7436, routeId: "route-91", routeName: "Route 91", routeShortName: "91", routeColor: "#f59e0b", nextArrivals: ["6 min", "16 min", "26 min"], distance: 0.4, walkingTime: 5 },
    { id: "stop-6", name: "Merkato", lat: 8.9854, lng: 38.7236, routeId: "route-12", routeName: "Route 12", routeShortName: "12", routeColor: "#16a34a", nextArrivals: ["1 min", "11 min", "21 min"], distance: 0.6, walkingTime: 7 },
    { id: "stop-7", name: "Arat Kilo", lat: 9.0154, lng: 38.7536, routeId: "route-12", routeName: "Route 12", routeShortName: "12", routeColor: "#16a34a", nextArrivals: ["4 min", "14 min", "24 min"], distance: 0.3, walkingTime: 4 },
    { id: "stop-8", name: "National Theatre", lat: 9.0054, lng: 38.7436, routeId: "route-23", routeName: "Route 23", routeShortName: "23", routeColor: "#dc2626", nextArrivals: ["7 min", "17 min", "27 min"], distance: 0.2, walkingTime: 2 },
    { id: "stop-9", name: "Addis Ababa University", lat: 9.0054, lng: 38.7636, routeId: "route-38", routeName: "Route 38", routeShortName: "38", routeColor: "#1e40af", nextArrivals: ["9 min", "19 min", "29 min"], distance: 0.1, walkingTime: 1 },
    { id: "stop-10", name: "Sheraton Addis", lat: 9.0054, lng: 38.7636, routeId: "route-91", routeName: "Route 91", routeShortName: "91", routeColor: "#f59e0b", nextArrivals: ["2 min", "12 min", "22 min"], distance: 0.2, walkingTime: 2 }
  ]

  useEffect(() => {
    loadNearbyStops()
    const interval = setInterval(loadNearbyStops, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadNearbyStops = async () => {
    setIsLoading(true)
    try {
      const apiStops = await fetchNearbyStops(userLocation.lat, userLocation.lng, 1200)
      const mapped = (apiStops || []).map((s) => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        routeId: s.route_id,
        routeName: s.route_name,
        routeShortName: s.route_short_name,
        routeColor: s.route_color,
        nextArrivals: s.next_arrivals || ["3 min", "13 min", "23 min"],
        distance: (s.meters || 0) / 1000,
        walkingTime: Math.ceil(((s.meters || 0) / 1000) * 12),
      }))
      setNearbyStops(mapped)
    } catch (_e) {
      // fallback to Ethiopian stops if API fails
      setNearbyStops(ethiopianStops)
    }
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const calculateDistance = (pos1, pos2) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180
    const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filteredAndSortedStops = nearbyStops
    .filter((stop) => filterRoute === "all" || stop.routeId === filterRoute)
    .sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance
        case "time":
          return Number.parseInt(a.nextArrivals[0]) - Number.parseInt(b.nextArrivals[0])
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const uniqueRoutes = [...new Set(nearbyStops.map((stop) => stop.routeId))]

  const handleRefresh = () => {
    loadNearbyStops()
  }

  const addToFavorites = (stopId) => {
    // TODO: Implement favorites functionality
    console.log("Adding stop to favorites:", stopId)
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>
      <TopBar />
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 px-4 py-4 backdrop-blur rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nearby Stops</h1>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center space-x-2 mt-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/80 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 overflow-hidden rounded-b-2xl backdrop-blur"
          >
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Route Filter */}
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter by Route
                  </label>
                  <select
                    value={filterRoute}
                    onChange={(e) => setFilterRoute(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Routes</option>
                    {uniqueRoutes.map((routeId) => {
                      const route = routesData.find((r) => r.id === routeId)
                      return (
                        <option key={routeId} value={routeId}>
                          {route?.shortName} - {route?.name}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="distance">Distance</option>
                    <option value="time">Next Arrival</option>
                    <option value="name">Stop Name</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stops List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading nearby stops...</span>
          </div>
        ) : filteredAndSortedStops.length > 0 ? (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filteredAndSortedStops.map((stop, index) => (
              <motion.div
                key={`${stop.id}-${stop.routeId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
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
                      <button
                        onClick={() => addToFavorites(stop.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                      </button>
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
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4">
                    <Navigation className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No stops found</h3>
            <p className="text-gray-500 text-center">
              {filterRoute !== "all" ? "Try changing your route filter" : "No nearby stops available"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NearbyPage
