"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Star, MapPin, Clock, Navigation, Plus } from "lucide-react"
import { fetchRoutesWithStops, fetchBusStatus } from "../lib/api"

export default function FavoritesMobile({ darkMode, setDarkMode }) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      // Load routes and buses to create favorites
      const routes = await fetchRoutesWithStops()
      const buses = await fetchBusStatus()
      
      // Create favorites from routes with bus information
      const routeFavorites = routes.slice(0, 5).map(route => {
        const routeBuses = buses.filter(bus => String(bus.route_id) === String(route.id))
        const nextBus = routeBuses[0]
        
        return {
          id: route.id,
          type: 'route',
          name: route.name || route.short_name,
          description: route.stops?.[0]?.name ? `From ${route.stops[0].name}` : 'Route',
          color: route.color || '#3B82F6',
          shortName: route.short_name || route.shortName || '?',
          eta: nextBus?.eta_minutes ? `${nextBus.eta_minutes} min` : 'N/A',
          nextArrival: nextBus?.eta_minutes ? `${new Date(Date.now() + nextBus.eta_minutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A',
          busCount: routeBuses.length
        }
      })
      
      setFavorites(routeFavorites)
    } catch (error) {
      console.error('Error loading favorites:', error)
      // Fallback to empty state
      setFavorites([])
    }
    setLoading(false)
  }

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="safe-screen px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Favorites</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your saved routes & stops</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Favorites List */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading favorites...</span>
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((favorite, index) => (
              <motion.div
                key={favorite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: favorite.color }}
                    >
                      {favorite.shortName}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{favorite.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{favorite.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{favorite.eta}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-3 h-3" />
                          <span>{favorite.nextArrival}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <motion.button 
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Navigation className="w-5 h-5 text-gray-400" />
                    </motion.button>
                    <motion.button 
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorites yet</h3>
            <p className="text-gray-500 text-center mb-4">Save routes and stops you use frequently</p>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-2xl font-semibold text-white shadow-lg"
              style={{ backgroundColor: '#2ECC71' }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              Add Favorites
            </motion.button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-gray-800 rounded-t-3xl p-6 max-h-96"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add to Favorites</h2>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search routes or stops..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Search for routes or stops to add to your favorites
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}














