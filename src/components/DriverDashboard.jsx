import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bus, MapPin, Navigation, AlertTriangle, CheckCircle, Clock, Users, Route } from 'lucide-react'
import { fetchBusStatus } from '../lib/api'

const DriverDashboard = () => {
  const [currentBus, setCurrentBus] = useState(null)
  const [rerouteCommand, setRerouteCommand] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showRerouteModal, setShowRerouteModal] = useState(false)

  useEffect(() => {
    // Simulate driver login - in real implementation, this would be based on driver authentication
    const mockDriverBus = {
      bus_id: 'bus-12-1',
      plate_number: 'AA-1234-5678',
      route_id: 'route-12',
      route_short_name: '12',
      route_name: 'Route 12 - Bole to Piazza',
      passengers: 25,
      max_capacity: 50,
      status: 'yellow',
      status_emoji: '🟡',
      fullness_percentage: 50,
      last_lat: 38.7756,
      last_lng: 9.0192
    }
    setCurrentBus(mockDriverBus)

    // Simulate receiving reroute commands
    simulateRerouteCommands()
  }, [])

  const simulateRerouteCommands = () => {
    // Simulate receiving a reroute command after 5 seconds
    setTimeout(() => {
      const mockRerouteCommand = {
        id: 'reroute-001',
        timestamp: new Date().toISOString(),
        from: 'Admin Fleet Management',
        destination: {
          name: 'Meskel Square',
          lng: 38.7756,
          lat: 9.0192,
          reason: 'High passenger demand detected',
          expectedPassengers: 45
        },
        priority: 'high',
        estimatedArrival: '15 minutes'
      }
      setRerouteCommand(mockRerouteCommand)
      setShowRerouteModal(true)
    }, 5000)
  }

  const handleAcceptReroute = () => {
    setIsLoading(true)
    setMessage('')
    
    // Simulate accepting the reroute
    setTimeout(() => {
      setMessage('✅ Reroute accepted! Navigating to new destination.')
      setShowRerouteModal(false)
      setIsLoading(false)
      
      // Clear the command after accepting
      setTimeout(() => {
        setRerouteCommand(null)
        setMessage('')
      }, 3000)
    }, 1000)
  }

  const handleDeclineReroute = () => {
    setMessage('❌ Reroute declined. Continuing on current route.')
    setShowRerouteModal(false)
    setRerouteCommand(null)
    
    setTimeout(() => {
      setMessage('')
    }, 3000)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return 'text-green-600 bg-green-100'
      case 'yellow': return 'text-yellow-600 bg-yellow-100'
      case 'red': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!currentBus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading driver dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Driver Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bus {currentBus.plate_number} - Route {currentBus.route_short_name}
          </p>
        </div>

        {/* Current Bus Status */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Bus Status</div>
                <div className="text-lg font-semibold">{currentBus.status_emoji} {currentBus.status}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Passengers</div>
                <div className="text-lg font-semibold">{currentBus.passengers}/{currentBus.max_capacity}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentBus.status === 'green' ? 'bg-green-500' :
                  currentBus.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(currentBus.fullness_percentage, 100)}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Route className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Route</div>
                <div className="text-lg font-semibold">{currentBus.route_short_name}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Next Stop</div>
                <div className="text-lg font-semibold">5 min</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Message Display */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          </motion.div>
        )}

        {/* Current Route Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            Current Route: {currentBus.route_name}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Route ID</div>
              <div className="font-semibold">{currentBus.route_id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plate Number</div>
              <div className="font-semibold">{currentBus.plate_number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Location</div>
              <div className="font-semibold">Lat: {currentBus.last_lat?.toFixed(4)}, Lng: {currentBus.last_lng?.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</div>
              <div className="font-semibold">{currentBus.fullness_percentage}% full</div>
            </div>
          </div>
        </div>

        {/* Reroute Command Modal */}
        <AnimatePresence>
          {showRerouteModal && rerouteCommand && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">New Reroute Command</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">From: {rerouteCommand.from}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        Destination: {rerouteCommand.destination.name}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <div>Reason: {rerouteCommand.destination.reason}</div>
                      <div>Expected Passengers: {rerouteCommand.destination.expectedPassengers}</div>
                      <div>ETA: {rerouteCommand.estimatedArrival}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rerouteCommand.priority)}`}>
                      {rerouteCommand.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(rerouteCommand.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAcceptReroute}
                    disabled={isLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Accept Reroute
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDeclineReroute}
                    disabled={isLoading}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default DriverDashboard





