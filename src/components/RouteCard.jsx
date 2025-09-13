"use client"

import { motion } from "framer-motion"
import { Clock, Users, ChevronRight } from "lucide-react"

const RouteCard = ({ route, busData, busStatusData = [], onClick }) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl p-3 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Route info */}
        <div className="flex items-start space-x-4 flex-1">
          {/* Large route number circle */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
            style={{ backgroundColor: route.color }}
          >
            {route.shortName}
          </div>

          {/* Route details */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{route.name}</h3>
              {route.type === "express" && (
                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                  Express
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{route.description}</p>

            {/* Stats row */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{busData.nextArrival}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{busData.activeBuses} buses</span>
              </div>
            </div>
            
            {/* Bus Status Indicators */}
            {busStatusData.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {busStatusData.slice(0, 2).map((bus, index) => (
                  <div key={bus.bus_id || index} className="flex items-center space-x-1 text-xs bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                    <span className="text-sm">{bus.status_emoji}</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {bus.passengers}/{bus.max_capacity}
                    </span>
                  </div>
                ))}
                {busStatusData.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                    +{busStatusData.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Time and arrow */}
        <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {busData.nextArrival.replace(" min", "")}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">minutes</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </motion.div>
  )
}

export default RouteCard
