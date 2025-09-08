"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Star, Clock, MapPin, Route, Trash2, Edit3, Plus, Home, Briefcase, Coffee } from "lucide-react"
import DarkModeToggle from "../components/DarkModeToggle"
import TopBar from "../components/TopBar"
import { fetchRoutes } from "../lib/api"

const FavoritesPage = ({ darkMode, setDarkMode }) => {
  const [activeTab, setActiveTab] = useState("stops")
  const [favoriteStops, setFavoriteStops] = useState([])
  const [savedRoutes, setSavedRoutes] = useState([])
  const [routes, setRoutes] = useState([])
  const [recentTrips, setRecentTrips] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Ethiopian favorite stops data
  const ethiopianFavoriteStops = [
    { id: "fav-1", name: "Meskel Square", routeId: "route-38", routeName: "Route 38", routeColor: "#1e40af", nextArrivals: ["2 min", "12 min"], distance: 0.1, category: "home" },
    { id: "fav-2", name: "Bole Airport", routeId: "route-91", routeName: "Route 91", routeColor: "#f59e0b", nextArrivals: ["5 min", "15 min"], distance: 0.3, category: "work" },
    { id: "fav-3", name: "Merkato", routeId: "route-12", routeName: "Route 12", routeColor: "#16a34a", nextArrivals: ["1 min", "11 min"], distance: 0.2, category: "shopping" },
    { id: "fav-4", name: "National Theatre", routeId: "route-23", routeName: "Route 23", routeColor: "#dc2626", nextArrivals: ["7 min", "17 min"], distance: 0.4, category: "entertainment" }
  ]

  // Ethiopian recent trips data
  const ethiopianRecentTrips = [
    { id: "trip-1", from: "Meskel Square", to: "Bole Airport", duration: "25 min", routes: ["Route 38", "Route 91"], timestamp: "2 hours ago" },
    { id: "trip-2", from: "Piazza", to: "Merkato", duration: "18 min", routes: ["Route 38", "Route 12"], timestamp: "Yesterday" },
    { id: "trip-3", from: "CMC Terminal", to: "National Theatre", duration: "22 min", routes: ["Route 38", "Route 23"], timestamp: "2 days ago" }
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
    
    // Initialize with Ethiopian data
    setFavoriteStops(ethiopianFavoriteStops)
    setRecentTrips(ethiopianRecentTrips)
  }, [])

  const tabs = [
    { id: "stops", label: "Stops", icon: MapPin },
    { id: "routes", label: "Routes", icon: Route },
    { id: "trips", label: "Recent", icon: Clock },
  ]

  const locationIcons = {
    home: Home,
    work: Briefcase,
    coffee: Coffee,
    star: Star,
  }

  useEffect(() => {
    loadFavoritesData()
  }, [])

  const loadFavoritesData = () => {
    // Load from localStorage or use mock data
    const savedStops = JSON.parse(localStorage.getItem("transit-favorite-stops") || "[]")
    const savedRoutesData = JSON.parse(localStorage.getItem("transit-saved-routes") || "[]")
    const recentTripsData = JSON.parse(localStorage.getItem("transit-recent-trips") || "[]")

    // If no saved data, use mock data
    if (savedStops.length === 0) {
      const mockStops = [
        {
          id: "fav-1",
          name: "School St / Queen St",
          nickname: "Home Stop",
          icon: "home",
          routeShortName: "38",
          routeColor: "#1e40af",
          nextArrivals: ["3 min", "13 min", "23 min"],
          lastUpdated: new Date(),
        },
        {
          id: "fav-2",
          name: "Athens Chapel",
          nickname: "Work",
          icon: "work",
          routeShortName: "12",
          routeColor: "#16a34a",
          nextArrivals: ["7 min", "17 min", "27 min"],
          lastUpdated: new Date(),
        },
        {
          id: "fav-3",
          name: "Puck's Pharmacy",
          nickname: "Coffee Shop",
          icon: "coffee",
          routeShortName: "91",
          routeColor: "#f59e0b",
          nextArrivals: ["12 min", "22 min", "32 min"],
          lastUpdated: new Date(),
        },
      ]
      setFavoriteStops(mockStops)
      localStorage.setItem("transit-favorite-stops", JSON.stringify(mockStops))
    } else {
      setFavoriteStops(savedStops)
    }

    if (savedRoutesData.length === 0) {
      const mockRoutes = [
        {
          id: "saved-route-1",
          name: "Home to Work",
          from: "School St / Queen St",
          to: "Athens Chapel",
          routes: [routes[0], routes[2]],
          duration: "25 min",
          lastUsed: new Date(),
        },
        {
          id: "saved-route-2",
          name: "Weekend Shopping",
          from: "Current Location",
          to: "Glade Terminal",
          routes: [routes[0]],
          duration: "18 min",
          lastUsed: new Date(Date.now() - 86400000), // Yesterday
        },
      ]
      setSavedRoutes(mockRoutes)
      localStorage.setItem("transit-saved-routes", JSON.stringify(mockRoutes))
    } else {
      setSavedRoutes(savedRoutesData)
    }

    if (recentTripsData.length === 0) {
      const mockTrips = [
        {
          id: "trip-1",
          from: "School St / Queen St",
          to: "Great Theatre",
          date: new Date(),
          duration: "22 min",
          routes: [routes[3]],
        },
        {
          id: "trip-2",
          from: "Athens Chapel",
          to: "Puck's Pharmacy",
          date: new Date(Date.now() - 3600000), // 1 hour ago
          duration: "15 min",
          routes: [routes[1]],
        },
        {
          id: "trip-3",
          from: "Current Location",
          to: "Shakespeare Ave",
          date: new Date(Date.now() - 7200000), // 2 hours ago
          duration: "28 min",
          routes: [routes[1]],
        },
      ]
      setRecentTrips(mockTrips)
      localStorage.setItem("transit-recent-trips", JSON.stringify(mockTrips))
    } else {
      setRecentTrips(recentTripsData)
    }
  }

  const deleteFavoriteStop = (stopId) => {
    const updatedStops = favoriteStops.filter((stop) => stop.id !== stopId)
    setFavoriteStops(updatedStops)
    localStorage.setItem("transit-favorite-stops", JSON.stringify(updatedStops))
  }

  const deleteSavedRoute = (routeId) => {
    const updatedRoutes = savedRoutes.filter((route) => route.id !== routeId)
    setSavedRoutes(updatedRoutes)
    localStorage.setItem("transit-saved-routes", JSON.stringify(updatedRoutes))
  }

  const updateStopNickname = (stopId, newNickname) => {
    const updatedStops = favoriteStops.map((stop) => (stop.id === stopId ? { ...stop, nickname: newNickname } : stop))
    setFavoriteStops(updatedStops)
    localStorage.setItem("transit-favorite-stops", JSON.stringify(updatedStops))
    setEditingItem(null)
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - new Date(date)
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-white/70 dark:bg-gray-800/60 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all relative ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === "stops" && (
            <motion.div
              key="stops"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-0 max-w-4xl mx-auto"
            >
              {favoriteStops.length > 0 ? (
                <div className="space-y-3">
                  {favoriteStops.map((stop, index) => {
                    const IconComponent = locationIcons[stop.icon] || Star
                    return (
                      <motion.div
                        key={stop.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>

                            <div className="flex-1">
                              {editingItem === stop.id ? (
                                <input
                                  type="text"
                                  defaultValue={stop.nickname}
                                  onBlur={(e) => updateStopNickname(stop.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      updateStopNickname(stop.id, e.target.value)
                                    }
                                  }}
                                  className="text-lg font-semibold bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                                  autoFocus
                                />
                              ) : (
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{stop.nickname}</h3>
                              )}
                              <p className="text-sm text-gray-500 mb-2">{stop.name}</p>

                              <div className="flex items-center space-x-2 mb-3">
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: stop.routeColor }}
                                >
                                  {stop.routeShortName}
                                </div>
                                <span className="text-sm text-gray-500">Next arrivals</span>
                              </div>

                              <div className="flex space-x-2">
                                {stop.nextArrivals.map((arrival, idx) => (
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

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingItem(stop.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => deleteFavoriteStop(stop.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite stops yet</h3>
                  <p className="text-gray-500">Add stops to your favorites for quick access to arrival times.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "routes" && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-0 max-w-4xl mx-auto"
            >
              {savedRoutes.length > 0 ? (
                <div className="space-y-3">
                  {savedRoutes.map((route, index) => (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{route.name}</h3>

                          <div className="flex items-center space-x-2 mb-3">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{route.from}</span>
                            <span className="text-gray-400">→</span>
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{route.to}</span>
                          </div>

                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-1">
                              {route.routes.map((r, idx) => (
                                <div key={idx} className="flex items-center space-x-1">
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: r.color }}
                                  >
                                    {r.shortName}
                                  </div>
                                  {idx < route.routes.length - 1 && <span className="text-gray-400 text-sm">→</span>}
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{route.duration}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Last used: {formatTimeAgo(route.lastUsed)}</span>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                              Go Now
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteSavedRoute(route.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved routes yet</h3>
                  <p className="text-gray-500">Save your frequent trips for quick access.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "trips" && (
            <motion.div
              key="trips"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-0 max-w-4xl mx-auto"
            >
              {recentTrips.length > 0 ? (
                <div className="space-y-3">
                  {recentTrips.map((trip, index) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{trip.from}</span>
                            <span className="text-gray-400">→</span>
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{trip.to}</span>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              {trip.routes.map((route, idx) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: route.color }}
                                >
                                  {route.shortName}
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{trip.duration}</span>
                            <span className="text-xs text-gray-400">{formatTimeAgo(trip.date)}</span>
                          </div>
                        </div>

                        <button className="px-3 py-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium">
                          Repeat
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent trips</h3>
                  <p className="text-gray-500">Your recent trip searches will appear here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default FavoritesPage
