"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Clock, ArrowRight, Navigation, Zap, Footprints, DollarSign } from "lucide-react"
import { useLocation } from "react-router-dom"
import DarkModeToggle from "../components/DarkModeToggle"
import TopBar from "../components/TopBar"
import MapView from "../components/MapView"
import { planTrip, fetchRoutes } from "../lib/api"

const TripPlannerPage = ({ darkMode, setDarkMode }) => {
  const location = useLocation()
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [departureTime, setDepartureTime] = useState("now")
  const [customTime, setCustomTime] = useState("")
  const [customDate, setCustomDate] = useState("")
  const [tripPreference, setTripPreference] = useState("fastest")
  const [fromCoord, setFromCoord] = useState(null)
  const [toCoord, setToCoord] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState({ from: false, to: false })
  const [routes, setRoutes] = useState([])

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

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const routesData = await fetchRoutes()
        setRoutes(routesData || [])
      } catch (e) {
        setRoutes([])
      }
    }
    loadRoutes()
  }, [])

  // Handle location data passed from sidebar
  useEffect(() => {
    if (location.state) {
      const { from, to } = location.state
      if (from) {
        setFromLocation(from.name)
        setFromCoord(from)
      }
      if (to) {
        setToLocation(to.name)
        setToCoord(to)
      }
    }
  }, [location.state])

  // Ethiopian locations for autocomplete
  const locations = ethiopianLocations.map(loc => loc.name)

  const tripPreferences = [
    { id: "fastest", label: "Fastest", icon: Zap, description: "Minimize travel time" },
    { id: "least-walking", label: "Least Walking", icon: Footprints, description: "Minimize walking distance" },
    { id: "cheapest", label: "Cheapest", icon: DollarSign, description: "Lowest fare options" },
  ]

  useEffect(() => {
    if (fromLocation && toLocation && fromLocation !== toLocation) {
      handleSearch()
    }
  }, [fromLocation, toLocation, departureTime, tripPreference])

  const handleSearch = async () => {
    if (!fromLocation && !fromCoord) return
    if (!toLocation && !toCoord) return
    setIsSearching(true)
    try {
      // Find coordinates for locations
      const fromLocationData = fromCoord || ethiopianLocations.find(loc => 
        loc.name.toLowerCase().includes(fromLocation.toLowerCase())
      )
      const toLocationData = toCoord || ethiopianLocations.find(loc => 
        loc.name.toLowerCase().includes(toLocation.toLowerCase())
      )

      const body = {
        from: fromLocationData || { name: fromLocation, lat: 9.0054, lng: 38.7636 },
        to: toLocationData || { name: toLocation, lat: 9.0154, lng: 38.7736 },
        departureTime,
        preference: tripPreference,
      }
      const res = await planTrip(body)
      const opts = res?.options || []
      if (opts.length) {
        setSearchResults(opts.map((o, i) => ({
          id: `api-${i}`,
          departureTime: "Now",
          arrivalTime: "Soon",
          duration: o.duration || "--",
          walkingTime: o.walkingTime || "--",
          transfers: o.transfers || 0,
          routes: routes.slice(0, Math.max(1, (o.routes || []).length || 1)).map(route => ({
            shortName: route.short_name || route.shortName || "38",
            color: route.color || "#1e40af",
            name: route.name || "Route 38"
          })),
          fare: o.fare || "$2.50",
          co2Saved: "1.2 kg",
          preference: tripPreference,
        })))
      } else {
        setSearchResults(generateMockTrips(fromLocation || "From", toLocation || "To"))
      }
    } catch (_e) {
      setSearchResults(generateMockTrips(fromLocation || "From", toLocation || "To"))
    }
    setIsSearching(false)
  }

  const generateMockTrips = (from, to) => {
    const baseTime = new Date()
    const results = []

    // Generate 3-4 different route options
    for (let i = 0; i < 3; i++) {
      const departTime = new Date(baseTime.getTime() + (i * 5 + 2) * 60000)
      const arriveTime = new Date(departTime.getTime() + (25 + i * 5) * 60000)
      const walkTime = 3 + i * 2

      results.push({
        id: `trip-${i}`,
        departureTime: departTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        arrivalTime: arriveTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: `${25 + i * 5} min`,
        walkingTime: `${walkTime} min walk`,
        transfers: i === 0 ? 0 : i,
        routes:
          i === 0 ? [routes[0] || { shortName: "38", color: "#1e40af", name: "Route 38" }] : 
                   [routes[i % routes.length] || { shortName: "38", color: "#1e40af", name: "Route 38" }, 
                    routes[(i + 1) % routes.length] || { shortName: "91", color: "#f59e0b", name: "Route 91" }],
        // Switch to ETB fare estimation
        fare: `${(20 + i * 5).toFixed(0)} ETB`,
        co2Saved: `${(1.2 + i * 0.3).toFixed(1)} kg`,
        preference: i === 0 ? "fastest" : i === 1 ? "least-walking" : "cheapest",
      })
    }

    return results
  }

  const filteredLocations = (query, type) => {
    if (!query) return []
    return locations
      .filter(
        (location) =>
          location.toLowerCase().includes(query.toLowerCase()) &&
          location !== (type === "from" ? toLocation : fromLocation),
      )
      .slice(0, 5)
  }

  const swapLocations = () => {
    const temp = fromLocation
    setFromLocation(toLocation)
    setToLocation(temp)
    const tempCoord = fromCoord
    setFromCoord(toCoord)
    setToCoord(tempCoord)
  }

  const handleMapClick = (pos) => {
    if (!fromCoord) {
      setFromCoord(pos)
    } else if (!toCoord) {
      setToCoord(pos)
    } else {
      setFromCoord(pos)
      setToCoord(null)
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trip Planner</h1>
          <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </div>
      </div>

      <div className="flex-1 overflow-auto grid lg:grid-cols-2 gap-0">
        {/* Search Form */}
        <div className="p-4 order-2 lg:order-1">
          <div className="max-w-2xl mx-auto space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            {/* From/To Inputs */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>

                <div className="flex-1 space-y-3">
                  {/* From Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="From"
                      value={fromLocation}
                      onChange={(e) => {
                        setFromLocation(e.target.value)
                        setShowSuggestions({ ...showSuggestions, from: true })
                      }}
                      onFocus={() => setShowSuggestions({ ...showSuggestions, from: true })}
                      className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />

                    {/* From Suggestions */}
                    <AnimatePresence>
                      {showSuggestions.from && fromLocation && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 z-20 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1"
                        >
                          {filteredLocations(fromLocation, "from").map((location, index) => {
                            const locationData = ethiopianLocations.find(loc => loc.name === location)
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  setFromLocation(location)
                                  setFromCoord(locationData)
                                  setShowSuggestions({ ...showSuggestions, from: false })
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                              >
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-900 dark:text-white">{location}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">{locationData?.type}</span>
                                </div>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* To Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="To"
                      value={toLocation}
                      onChange={(e) => {
                        setToLocation(e.target.value)
                        setShowSuggestions({ ...showSuggestions, to: true })
                      }}
                      onFocus={() => setShowSuggestions({ ...showSuggestions, to: true })}
                      className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />

                    {/* To Suggestions */}
                    <AnimatePresence>
                      {showSuggestions.to && toLocation && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 z-20 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1"
                        >
                          {filteredLocations(toLocation, "to").map((location, index) => {
                            const locationData = ethiopianLocations.find(loc => loc.name === location)
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  setToLocation(location)
                                  setToCoord(locationData)
                                  setShowSuggestions({ ...showSuggestions, to: false })
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                              >
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-900 dark:text-white">{location}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">{locationData?.type}</span>
                                </div>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Swap Button */}
                <button
                  onClick={swapLocations}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  disabled={!fromLocation || !toLocation}
                >
                  <Navigation className="w-5 h-5 text-gray-400 transform rotate-90" />
                </button>
              </div>
            </div>

            {/* Time Selection */}
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <select
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="px-3 py-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="now">Leave now</option>
                <option value="depart">Depart at</option>
                <option value="arrive">Arrive by</option>
              </select>

              {departureTime !== "now" && (
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="px-3 py-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-3 py-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Trip Preferences */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {tripPreferences.map((pref) => {
                const Icon = pref.icon
                return (
                  <button
                    key={pref.id}
                    onClick={() => setTripPreference(pref.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                      tripPreference === pref.id
                        ? "bg-emerald-600 text-white"
                        : "bg-white/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{pref.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Map Panel */}
        <div className="h-[50vh] lg:h-[calc(100vh-160px)] order-1 lg:order-2">
          <MapView plannerFrom={fromCoord} plannerTo={toCoord} onMapClick={handleMapClick} />
        </div>

        {/* Results */}
        <div className="flex-1 p-4 lg:col-span-2">
          <div className="max-w-2xl mx-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Finding best routes...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trip Options ({searchResults.length})
                </h2>

                {searchResults.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{trip.departureTime}</div>
                          <div className="text-sm text-gray-500">Depart</div>
                        </div>

                        <div className="flex items-center space-x-2 flex-1">
                          <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600 relative">
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{trip.arrivalTime}</div>
                          <div className="text-sm text-gray-500">Arrive</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {/* Black badge: operator/Menged + ETA */}
                        <div className="inline-flex items-center bg-black text-white text-[11px] px-2 py-1 rounded mb-1">
                          {/* Derive operator/menged from first route mock */}
                          <span className="mr-1">Menged ✔</span>
                          <span>• Anbessa</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{trip.duration}</div>
                        <div className="text-sm text-gray-500">{trip.fare}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {trip.routes.map((route, idx) => (
                            <div key={idx} className="flex items-center space-x-1">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: route.color }}
                              >
                                {route.shortName}
                              </div>
                              {idx < trip.routes.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400" />}
                            </div>
                          ))}
                        </div>

                        <span className="text-gray-500">{trip.walkingTime}</span>

                        {trip.transfers > 0 && (
                          <span className="text-gray-500">
                            {trip.transfers} transfer{trip.transfers > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-gray-500">
                        <span>🌱 {trip.co2Saved} CO₂ saved</span>
                        {/* ETA display for the overall trip */}
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">ETA {trip.arrivalTime}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : fromLocation && toLocation ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No routes found between these locations.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your starting point and destination to plan your trip.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripPlannerPage
