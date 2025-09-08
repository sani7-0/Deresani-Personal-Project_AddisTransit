"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Info, CheckCircle, XCircle, Clock, MapPin, Filter, Cloud, Construction } from "lucide-react"
import DarkModeToggle from "../components/DarkModeToggle"
import TopBar from "../components/TopBar"
import { fetchAlerts, fetchRoutes } from "../lib/api"

const AlertsPage = ({ darkMode, setDarkMode }) => {
  const [alerts, setAlerts] = useState([])
  const [routes, setRoutes] = useState([])
  const [filteredAlerts, setFilteredAlerts] = useState([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [notificationSettings, setNotificationSettings] = useState({
    disruptions: true,
    delays: true,
    maintenance: false,
    weather: true,
  })

  const alertTypes = {
    disruption: {
      label: "Service Disruption",
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
    },
    delay: {
      label: "Delay",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    maintenance: {
      label: "Planned Maintenance",
      icon: Construction,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    weather: {
      label: "Weather Alert",
      icon: Cloud,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    info: {
      label: "Information",
      icon: Info,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-800",
      borderColor: "border-gray-200 dark:border-gray-700",
    },
  }

  const severityLevels = {
    high: { label: "High", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900" },
    medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900" },
    low: { label: "Low", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900" },
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterAlerts()
  }, [alerts, activeFilter])

  const loadAlerts = async () => {
    setIsLoading(true)
    try {
      const [alertsData, routesData] = await Promise.all([
        fetchAlerts(),
        fetchRoutes()
      ])
      
      // normalize date fields
      const normalized = (alertsData || []).map((a) => ({
        ...a,
        startTime: a.start_time ? new Date(a.start_time) : new Date(),
        endTime: a.end_time ? new Date(a.end_time) : null,
        lastUpdated: a.updated_at ? new Date(a.updated_at) : new Date(),
      }))
      setAlerts(normalized)
      setRoutes(routesData || [])
    } catch (e) {
      setAlerts([])
      setRoutes([])
    }
    setIsLoading(false)
  }

  const filterAlerts = () => {
    let filtered = alerts

    if (activeFilter !== "all") {
      filtered = alerts.filter((alert) => alert.type === activeFilter)
    }

    // Sort by severity and recency
    filtered.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity]
      }
      return new Date(b.lastUpdated) - new Date(a.lastUpdated)
    })

    setFilteredAlerts(filtered)
  }

  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime)
    const now = new Date()

    if (start > now) {
      const diffHours = Math.ceil((start - now) / (1000 * 60 * 60))
      return `Starts in ${diffHours}h`
    }

    if (!endTime) {
      return "Ongoing"
    }

    const end = new Date(endTime)
    if (end < now) {
      return "Resolved"
    }

    const diffHours = Math.ceil((end - now) / (1000 * 60 * 60))
    return `${diffHours}h remaining`
  }

  const getRouteInfo = (routeId) => {
    return routes.find((route) => route.short_name === routeId)
  }

  const toggleNotificationSetting = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Alerts</h1>
            {filteredAlerts.filter((alert) => alert.isActive && alert.severity === "high").length > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-600">
                  {filteredAlerts.filter((alert) => alert.isActive && alert.severity === "high").length} Active
                </span>
              </div>
            )}
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

        {/* Filter Tabs */}
        <div className="flex space-x-1 mt-4 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All Alerts" },
            { id: "disruption", label: "Disruptions" },
            { id: "delay", label: "Delays" },
            { id: "maintenance", label: "Maintenance" },
            { id: "weather", label: "Weather" },
            { id: "info", label: "Info" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/80 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 overflow-hidden rounded-b-2xl backdrop-blur"
          >
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Notification Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(notificationSettings).map(([key, enabled]) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleNotificationSetting(key)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading alerts...</span>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {filteredAlerts.map((alert, index) => {
              const alertType = alertTypes[alert.type]
              const severity = severityLevels[alert.severity]
              const Icon = alertType.icon

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl border p-4 ${alertType.bgColor} ${alertType.borderColor} shadow-sm`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${severity.bgColor}`}>
                      <Icon className={`w-5 h-5 ${alertType.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{alert.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${severity.color} ${severity.bgColor}`}
                        >
                          {severity.label}
                        </span>
                        {alert.isActive && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-600">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-3">{alert.description}</p>

                      {/* Affected Routes */}
                      {alert.affectedRoutes && alert.affectedRoutes.length > 0 && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500">Affected routes:</span>
                          <div className="flex space-x-1">
                            {alert.affectedRoutes.map((routeId) => {
                              const route = getRouteInfo(routeId)
                              return (
                                <div
                                  key={routeId}
                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: route?.color || "#6b7280" }}
                                >
                                  {routeId}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Affected Stops */}
                      {alert.affectedStops && alert.affectedStops.length > 0 && (
                        <div className="flex items-start space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedStops.map((stop, idx) => (
                              <span key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                {stop}
                                {idx < alert.affectedStops.length - 1 && ","}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Time Information */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{formatTimeRange(alert.startTime, alert.endTime)}</span>
                        <span className="text-gray-400">
                          Updated: {alert.lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Clear!</h3>
            <p className="text-gray-500 text-center">
              {activeFilter === "all" ? "No service alerts at this time." : `No ${activeFilter} alerts currently.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertsPage
