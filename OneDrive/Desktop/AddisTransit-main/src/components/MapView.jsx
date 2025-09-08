"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import MapGL, { Marker, Popup, Source, Layer } from "@urbica/react-map-gl"
import { RotateCcw, Loader2, Route, Zap, RefreshCw, Settings, Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BusMarker from "./BusMarker"
import { fetchRoutesWithStops, fetchBuses, fetchEthiopianBuses, fetchBusesForRoute, getSimulationStatus, addBusToRoute, removeBus, openBusesSSE, fetchRouteGeometry, getSnappedRoute, getSnappedRouteOSRM } from "../lib/api"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

const MapView = ({ selectedRoute, onRouteSelect, plannerFrom, plannerTo, onMapClick }) => {
  const mapRef = useRef()
  const [viewState, setViewState] = useState({
    longitude: 38.7636, // Addis Ababa longitude
    latitude: 9.0054,   // Addis Ababa latitude
    zoom: 13,
  })
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [routeGeometries, setRouteGeometries] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/light-v11")
  const [isLoading, setIsLoading] = useState(true)
  const [isRecentering, setIsRecentering] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [useRoadSnapping, setUseRoadSnapping] = useState(true)
  const [isLoadingBuses, setIsLoadingBuses] = useState(false)
  const [simulationStatus, setSimulationStatus] = useState(null)
  const [showSimulationControls, setShowSimulationControls] = useState(false)

  // Update map style based on dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setMapStyle(isDark ? "mapbox://styles/mapbox/dark-v10" : "mapbox://styles/mapbox/light-v10")
  }, [])

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark")
      setMapStyle(isDark ? "mapbox://styles/mapbox/dark-v10" : "mapbox://styles/mapbox/light-v10")
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Load routes and buses from API
  // Function to create road-snapped geometry for routes
  const createSnappedRouteGeometry = async (routes, useSnapping = true) => {
    const snappedGeometries = []
    
    for (const route of routes) {
      if (route.stops && route.stops.length >= 2) {
        if (useSnapping) {
          try {
            // Extract coordinates from stops
            const coordinates = route.stops.map(stop => [stop.lng, stop.lat])
            
            // Try to get snapped route (use OSRM as it's free)
            const snappedGeometry = await getSnappedRouteOSRM(coordinates, 'driving')
            
            snappedGeometries.push({
              route_id: route.id,
              geometry: snappedGeometry.geometry,
              color: route.color || '#3b82f6',
              properties: snappedGeometry.properties
            })
            
            console.log(`Snapped route ${route.id} with ${coordinates.length} stops`)
          } catch (error) {
            console.warn(`Failed to snap route ${route.id}, using straight line:`, error)
            // Fallback to straight line geometry
            snappedGeometries.push({
              route_id: route.id,
              geometry: {
                type: "LineString",
                coordinates: route.stops.map(stop => [stop.lng, stop.lat])
              },
              color: route.color || '#3b82f6'
            })
          }
        } else {
          // Use straight line geometry
          snappedGeometries.push({
            route_id: route.id,
            geometry: {
              type: "LineString",
              coordinates: route.stops.map(stop => [stop.lng, stop.lat])
            },
            color: route.color || '#3b82f6'
          })
        }
      }
    }
    
    return snappedGeometries
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesData, busesData] = await Promise.all([
          fetchRoutesWithStops(),
          fetchEthiopianBuses()
        ])
        
        setRoutes(routesData)
        setBuses(busesData)
        
        // Get simulation status
        const status = getSimulationStatus()
        setSimulationStatus(status)
        
        // Create road-snapped geometries for routes
        console.log(`Creating ${useRoadSnapping ? 'road-snapped' : 'straight-line'} route geometries...`)
        const snappedGeometries = await createSnappedRouteGeometry(routesData, useRoadSnapping)
        setRouteGeometries(snappedGeometries)
        
        setIsLoading(false)
      } catch (e) {
        console.error('Failed to load map data:', e)
        setRoutes([])
        setBuses([])
        setRouteGeometries([])
        setIsLoading(false)
      }
    }
    loadData()
  }, [useRoadSnapping])

  // Update buses from simulation every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const busesData = await fetchEthiopianBuses()
        setBuses(busesData)
        setLastUpdate(new Date())
        
        // Update simulation status
        const status = getSimulationStatus()
        setSimulationStatus(status)
      } catch (error) {
        console.error('Failed to fetch buses:', error)
      }
    }, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleRecenter = useCallback(() => {
    if (mapRef.current && !isRecentering) {
      setIsRecentering(true)
      mapRef.current.flyTo({
        center: [38.7636, 9.0054], // Addis Ababa
        zoom: 13,
        duration: 1200,
        essential: true,
      })

      setTimeout(() => {
        setIsRecentering(false)
      }, 1200)
    }
  }, [isRecentering])

  const handleRefreshBuses = useCallback(async () => {
    if (isLoadingBuses) return
    
    setIsLoadingBuses(true)
    try {
      console.log('Refreshing Ethiopian bus data...')
      const busesData = await fetchEthiopianBuses()
      setBuses(busesData)
      setLastUpdate(new Date())
      console.log(`Updated ${busesData.length} buses`)
    } catch (error) {
      console.error('Failed to refresh buses:', error)
    } finally {
      setIsLoadingBuses(false)
    }
  }, [isLoadingBuses])

  useEffect(() => {
    const handleRecenterEvent = () => {
      handleRecenter()
    }

    window.addEventListener("recenterMap", handleRecenterEvent)
    return () => window.removeEventListener("recenterMap", handleRecenterEvent)
  }, [handleRecenter])

  const handleBusClick = useCallback(
    (bus) => {
      setSelectedBus(bus)
      const route = routes.find((r) => r.id === bus.route_id)
      if (route && onRouteSelect) {
        onRouteSelect(route)
      }

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [bus.lng, bus.lat],
          zoom: Math.max(viewState.zoom, 15),
          duration: 800,
        })
      }
    },
    [onRouteSelect, viewState.zoom, routes]
  )

  const filteredBuses = selectedRoute ? buses.filter((bus) => bus.route_id === selectedRoute.id) : buses

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading transit data...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapGL
        ref={mapRef}
        {...viewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        accessToken={MAPBOX_TOKEN}
        onViewportChange={setViewState}
        onClick={(e) => {
          if (onMapClick && e && e.lngLat) {
            onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
          }
        }}
        onLoad={() => setIsLoading(false)}
      >
        {/* Routes */}
        {routeGeometries.map((routeGeom) => {
          const route = routes.find(r => r.id === routeGeom.route_id);
          if (!route || !routeGeom.geometry) return null;
          
          return (
            <Source
              key={`route-${routeGeom.route_id}`}
              id={`route-line-${routeGeom.route_id}`}
              type="geojson"
              data={{
                type: "Feature",
                geometry: routeGeom.geometry,
              }}
            >
              <Layer
                id={`route-line-layer-${routeGeom.route_id}`}
                type="line"
                source={`route-line-${routeGeom.route_id}`}
                paint={{
                  "line-color": routeGeom.color,
                  "line-width": selectedRoute?.id === routeGeom.route_id ? 6 : 4,
                  "line-opacity": selectedRoute?.id === routeGeom.route_id ? 1 : 0.6,
                }}
              />
            </Source>
          );
        })}

        {/* Bus markers */}
        <AnimatePresence>
          {filteredBuses.map((bus) => (
            <BusMarker
              key={bus.id}
              bus={bus}
              route={routes.find((r) => String(r.id) === String(bus.routeId || bus.route_id))}
              onClick={() => handleBusClick(bus)}
              isSelected={selectedBus?.id === bus.id}
            />
          ))}
        </AnimatePresence>

        {/* Popup */}
        <AnimatePresence>
          {selectedBus && (
            <Popup
              longitude={selectedBus.lng}
              latitude={selectedBus.lat}
              anchor="bottom"
              onClose={() => setSelectedBus(null)}
              closeButton={false}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="p-4 min-w-[280px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {routes.find((r) => r.id === selectedBus.route_id)?.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">#{selectedBus.vehicle_number}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Driver:</span>
                    <span className="text-gray-900 dark:text-gray-100">{selectedBus.driver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Stop:</span>
                    <span className="text-gray-900 dark:text-gray-100">{selectedBus.next_stop || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ETA:</span>
                    <span className="text-primary-600 font-medium">{selectedBus.eta || 'Unknown'}</span>
                  </div>
                </div>
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>

        {/* Planner markers */}
        {plannerFrom && (
          <Marker longitude={plannerFrom.lng} latitude={plannerFrom.lat} anchor="bottom">
            <div className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900" style={{ backgroundColor: "#16a34a" }} />
          </Marker>
        )}
        {plannerTo && (
          <Marker longitude={plannerTo.lng} latitude={plannerTo.lat} anchor="bottom">
            <div className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900" style={{ backgroundColor: "#ef4444" }} />
          </Marker>
        )}
      </MapGL>

      {/* Recenter button */}
      <motion.button
        onClick={handleRecenter}
        disabled={isRecentering}
        className="absolute bottom-6 right-6 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isRecentering ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: isRecentering ? 1.2 : 0.2 }}
        aria-label="Recenter map"
      >
        {isRecentering ? (
          <Loader2 className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-spin" />
        ) : (
          <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </motion.button>

      {/* Road snapping toggle */}
      <motion.button
        onClick={() => setUseRoadSnapping(!useRoadSnapping)}
        className={`absolute bottom-6 right-20 w-12 h-12 rounded-full shadow-lg border flex items-center justify-center transition-colors z-10 ${
          useRoadSnapping 
            ? 'bg-green-500 hover:bg-green-600 border-green-600 text-white' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={useRoadSnapping ? "Disable road snapping" : "Enable road snapping"}
        title={useRoadSnapping ? "Road snapping enabled - routes follow roads" : "Road snapping disabled - straight lines between stops"}
      >
        {useRoadSnapping ? (
          <Route className="w-5 h-5" />
        ) : (
          <Zap className="w-5 h-5" />
        )}
      </motion.button>


      {/* Refresh buses button */}
      <motion.button
        onClick={handleRefreshBuses}
        disabled={isLoadingBuses}
        className="absolute bottom-6 right-32 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-full shadow-lg border border-blue-600 flex items-center justify-center transition-colors z-10 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isLoadingBuses ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: isLoadingBuses ? 1 : 0.2 }}
        aria-label="Refresh bus locations"
        title="Refresh Ethiopian bus locations"
      >
        <RefreshCw className="w-5 h-5 text-white" />
      </motion.button>

      {/* Simulation controls toggle */}
      <motion.button
        onClick={() => setShowSimulationControls(!showSimulationControls)}
        className="absolute bottom-6 right-44 w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full shadow-lg border border-gray-500 flex items-center justify-center transition-colors z-10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Simulation controls"
        title="Bus simulation controls"
      >
        <Settings className="w-5 h-5 text-white" />
      </motion.button>

      {/* Simulation controls panel */}
      <AnimatePresence>
        {showSimulationControls && (
          <motion.div
            className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-20 min-w-64"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Bus Simulation</h3>
              <button
                onClick={() => setShowSimulationControls(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            {simulationStatus && (
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div>Status: <span className="text-green-600 dark:text-green-400">Running</span></div>
                <div>Buses: {simulationStatus.busCount}</div>
                <div>Routes: {simulationStatus.routes}</div>
                <div>Last Update: {simulationStatus.lastUpdate?.toLocaleTimeString()}</div>
              </div>
            )}
            
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Bus to Route:</div>
              <div className="flex flex-wrap gap-1">
                {routes.map(route => (
                  <button
                    key={route.id}
                    onClick={async () => {
                      try {
                        await addBusToRoute(route.id)
                        const busesData = await fetchEthiopianBuses()
                        setBuses(busesData)
                      } catch (error) {
                        console.error('Failed to add bus:', error)
                      }
                    }}
                    className="px-2 py-1 text-xs rounded"
                    style={{ 
                      backgroundColor: route.color + '20', 
                      color: route.color,
                      border: `1px solid ${route.color}`
                    }}
                  >
                    +{route.shortName}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live status */}
      <motion.div
        className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Simulation</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {buses.length} buses | {Math.floor((new Date() - lastUpdate) / 1000)}s ago
          </span>
        </div>
        {simulationStatus && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Routes: {simulationStatus.routes} | Running
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MapView
