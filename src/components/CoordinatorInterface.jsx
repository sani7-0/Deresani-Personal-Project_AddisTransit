"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, RotateCcw, Bus, Users } from "lucide-react"
import { fetchBusStatus, addTicket, resetBusCount } from "../lib/api"

const CoordinatorInterface = () => {
  const [busStatus, setBusStatus] = useState([])
  const [selectedPlate, setSelectedPlate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadBusStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadBusStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadBusStatus = async () => {
    try {
      const data = await fetchBusStatus()
      setBusStatus(data)
    } catch (error) {
      console.error('Failed to load bus status:', error)
    }
  }

  const handleAddTicket = async () => {
    if (!selectedPlate) {
      setMessage("Please select a bus plate number")
      return
    }

    setIsLoading(true)
    try {
      const result = await addTicket(selectedPlate)
      if (result.success) {
        setMessage(`✅ Ticket added! ${result.status_emoji} ${result.current_passengers}/${result.max_capacity} passengers`)
        await loadBusStatus() // Refresh data
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetBus = async () => {
    if (!selectedPlate) {
      setMessage("Please select a bus plate number")
      return
    }

    setIsLoading(true)
    try {
      const result = await resetBusCount(selectedPlate)
      if (result.success) {
        setMessage(`🔄 Bus reset! Previous count: ${result.previous_count}`)
        await loadBusStatus() // Refresh data
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return 'text-green-600 bg-green-100'
      case 'yellow': return 'text-yellow-600 bg-yellow-100'
      case 'red': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Bus Coordinator Interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track passenger counts and manage bus capacity
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h2>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Bus Plate Number
              </label>
              <select
                value={selectedPlate}
                onChange={(e) => setSelectedPlate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Choose a bus...</option>
                {busStatus.map((bus) => (
                  <option key={bus.bus_id} value={bus.plate_number}>
                    {bus.plate_number} - Route {bus.route_number} ({bus.route_short_name})
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleAddTicket}
              disabled={isLoading || !selectedPlate}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Print Ticket (+1)
            </button>
            
            <button
              onClick={handleResetBus}
              disabled={isLoading || !selectedPlate}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Bus
            </button>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg"
            >
              {message}
            </motion.div>
          )}
        </div>

        {/* Bus Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {busStatus.map((bus) => (
            <motion.div
              key={bus.bus_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-l-4"
              style={{ borderLeftColor: bus.route_color }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Route {bus.route_number}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                  {bus.status_emoji} {bus.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plate:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {bus.plate_number}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Passengers:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {bus.passengers}/{bus.max_capacity}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fullness:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {bus.fullness_percentage}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tickets Sold:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {bus.ticket_count || 0}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Capacity</span>
                    <span>{bus.fullness_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bus.status === 'green' ? 'bg-green-500' :
                        bus.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(bus.fullness_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {busStatus.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No bus data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoordinatorInterface
