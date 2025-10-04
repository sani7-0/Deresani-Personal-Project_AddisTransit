"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import MapGL, { Marker, Source, Layer } from "@urbica/react-map-gl"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Navigation, Clock, Search, X, Bus } from "lucide-react"
import { fetchNearbyStops, fetchRoutesWithStops, fetchBusStatus, planTrip, getSnappedRouteOSRM } from "../lib/api"
import BusMarker from "../components/BusMarker"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

export default function MapMobile({ darkMode, setDarkMode }) {
  const [userLocation, setUserLocation] = useState({ lat: 9.0054, lng: 38.7636 })
  const [nearbyRoutes, setNearbyRoutes] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [routeGeometries, setRouteGeometries] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)
  const [tripFrom, setTripFrom] = useState(null)
  const [tripTo, setTripTo] = useState(null)
  const [tripResults, setTripResults] = useState([])
  const [allRoutes, setAllRoutes] = useState([])
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const mapRef = useRef()
  const [viewState, setViewState] = useState({
    longitude: 38.7636,
    latitude: 9.0054,
    zoom: 13,
  })

  const mapStyle = darkMode ? "mapbox://styles/mapbox/dark-v10" : "mapbox://styles/mapbox/light-v10"

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [stopsData, routesData, busesData] = await Promise.all([
          fetchNearbyStops(userLocation.lat, userLocation.lng, 1200),
          fetchRoutesWithStops(),
          fetchBusStatus()
        ])
        
        // Process nearby routes for bottom sheet
        const nearbyRoutesData = (stopsData || []).map((s, i) => ({
          id: s.id || `route-${i}`,
          shortName: s.route_short_name || s.routeShortName || "38",
          destination: s.route_name || s.routeName || "Meskel Square",
          stopInfo: s.name || "Next stop in 350 m",
          color: s.route_color || "#3B82F6",
          eta: (s.next_arrivals && s.next_arrivals[0]) || "3 min",
          lat: s.lat || 9.0054,
          lng: s.lng || 38.7636,
        }))
        setNearbyRoutes(nearbyRoutesData.slice(0, 8))
        
        // Process routes for map
        setRoutes(routesData || [])
        
        // Create road-snapped route geometries
        const geometries = []
        for (const route of routesData || []) {
          if (route.stops && route.stops.length >= 2) {
            try {
              const coordinates = route.stops
                .filter(stop => stop.lat && stop.lng)
                .map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
              
              if (coordinates.length >= 2) {
                const snappedGeometry = await getSnappedRouteOSRM(coordinates, 'driving')
                geometries.push({
                  route_id: route.id,
                  geometry: snappedGeometry.geometry,
                  color: route.color
                })
              } else {
                // Fallback to straight line
                geometries.push({
                  route_id: route.id,
                  geometry: {
                    type: "LineString",
                    coordinates: route.stops.map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
                  },
                  color: route.color
                })
              }
            } catch (error) {
              // Fallback to straight line if snapping fails
              geometries.push({
                route_id: route.id,
                geometry: {
                  type: "LineString",
                  coordinates: route.stops.map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
                },
                color: route.color
              })
            }
          }
        }
        setRouteGeometries(geometries)
        
        // Set all routes for bottom sheet
        setAllRoutes(routesData || [])
        
        // Process buses
        setBuses(busesData || [])
        
      } catch (_e) {
        // Fallback data
        setNearbyRoutes([
          { id: "1", shortName: "38", destination: "Meskel Square", stopInfo: "Next stop in 350 m", color: "#3B82F6", eta: "3 min", lat: 9.0054, lng: 38.7636 },
          { id: "2", shortName: "91", destination: "Bole Airport", stopInfo: "Next stop in 200 m", color: "#F59E0B", eta: "5 min", lat: 9.0054, lng: 38.7636 },
          { id: "3", shortName: "12", destination: "Merkato", stopInfo: "Next stop in 500 m", color: "#FDE047", eta: "7 min", lat: 9.0054, lng: 38.7636 },
          { id: "4", shortName: "23", destination: "Piazza", stopInfo: "Next stop in 300 m", color: "#22C55E", eta: "11 min", lat: 9.0054, lng: 38.7636 },
        ])
        setRoutes([])
        setRouteGeometries([])
        setBuses([])
      }
      setLoading(false)
    }
    loadData()
    
    // Update buses every 10 seconds
    const interval = setInterval(async () => {
      try {
        const busesData = await fetchBusStatus()
        setBuses(busesData || [])
      } catch (_e) {}
    }, 10000)
    
    return () => clearInterval(interval)
  }, [userLocation])

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }
        
        setUserLocation(location)
        setIsLocating(false)
        
        // Center map on user location
        if (mapRef.current && mapRef.current.getMap) {
          const map = mapRef.current.getMap()
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500,
            essential: true,
          })
        }
        
        // Update viewState
        setViewState(prev => ({
          ...prev,
          longitude: longitude,
          latitude: latitude,
          zoom: 15
        }))
      },
      (error) => {
        console.error('Error getting location:', error)
        setLocationError('Unable to get location')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }, [])

  // Auto-get location on mount
  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  // Search functionality
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    try {
      // Search in routes and stops
      const results = []
      
      // Search routes
      routes.forEach(route => {
        if (route.name?.toLowerCase().includes(query.toLowerCase()) || 
            route.short_name?.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: `route-${route.id}`,
            type: 'route',
            name: route.name,
            shortName: route.short_name,
            color: route.color,
            lat: route.stops?.[0]?.lat,
            lng: route.stops?.[0]?.lng
          })
        }
      })
      
      // Search stops
      nearbyRoutes.forEach(route => {
        if (route.destination?.toLowerCase().includes(query.toLowerCase()) ||
            route.stopInfo?.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: `stop-${route.id}`,
            type: 'stop',
            name: route.destination,
            shortName: route.shortName,
            color: route.color,
            lat: route.lat,
            lng: route.lng
          })
        }
      })
      
      setSearchResults(results.slice(0, 5))
    } catch (_e) {
      setSearchResults([])
    }
  }, [routes, nearbyRoutes])

  // Trip planning
  const handleTripPlan = useCallback(async (from, to) => {
    if (!from || !to) return
    
    try {
      const trip = await planTrip(from.lat, from.lng, to.lat, to.lng)
      setTripResults(trip || [])
    } catch (_e) {
      setTripResults([])
    }
  }, [])

  // Bus click handler
  const handleBusClick = useCallback((bus) => {
    setSelectedBus(bus)
    setSheetOpen(true)
    
    // Center map on bus
    if (mapRef.current && mapRef.current.getMap) {
      const map = mapRef.current.getMap()
      map.flyTo({
        center: [bus.last_lng || bus.lng, bus.last_lat || bus.lat],
        zoom: Math.max(viewState.zoom, 15),
        duration: 800,
      })
    }
  }, [viewState.zoom])

  return (
    <div className="h-full w-full relative bg-white dark:bg-gray-900">
      {/* Fullscreen Map */}
      <MapGL
        ref={mapRef}
        {...viewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        accessToken={MAPBOX_TOKEN}
        onViewportChange={setViewState}
        onLoad={() => setLoading(false)}
        onClick={(e) => {
          if (e && e.lngLat) {
            const clickedLocation = { lat: e.lngLat.lat, lng: e.lngLat.lng }
            if (!tripFrom) {
              setTripFrom(clickedLocation)
            } else if (!tripTo) {
              setTripTo(clickedLocation)
              handleTripPlan(tripFrom, clickedLocation)
            }
          }
        }}
      >
        {/* Route polylines */}
        {routeGeometries.map((routeGeom) => (
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
                "line-width": 4,
                "line-opacity": 0.7,
              }}
            />
          </Source>
        ))}

        {/* User location marker */}
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        </Marker>

        {/* Bus markers */}
        {buses.map((bus) => (
          <BusMarker
            key={bus.bus_id}
            bus={{
              ...bus,
              id: bus.bus_id,
              lat: bus.last_lat,
              lng: bus.last_lng,
              vehicle_number: bus.plate_number,
              speed: 0,
              heading: 0,
              passengers: bus.passengers,
              max_capacity: bus.max_capacity
            }}
            route={routes.find((r) => String(r.id) === String(bus.route_id))}
            onClick={() => handleBusClick({
              ...bus,
              id: bus.bus_id,
              lat: bus.last_lat,
              lng: bus.last_lng,
              vehicle_number: bus.plate_number,
              speed: 0,
              heading: 0,
              passengers: bus.passengers,
              max_capacity: bus.max_capacity
            })}
            isSelected={selectedBus?.bus_id === bus.bus_id}
            isMobile={true}
          />
        ))}

        {/* Route stop markers */}
        {nearbyRoutes.map((route) => (
          <Marker key={route.id} longitude={route.lng} latitude={route.lat} anchor="bottom">
            <div className="w-6 h-6 bg-white rounded-full border-2 shadow-lg flex items-center justify-center" style={{ borderColor: route.color }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
            </div>
          </Marker>
        ))}

        {/* Trip planning markers */}
        {tripFrom && (
          <Marker longitude={tripFrom.lng} latitude={tripFrom.lat} anchor="bottom">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
          </Marker>
        )}
        {tripTo && (
          <Marker longitude={tripTo.lng} latitude={tripTo.lat} anchor="bottom">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
          </Marker>
        )}
      </MapGL>

      {/* Floating Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="relative">
          <motion.div 
            className="h-12 rounded-2xl flex items-center justify-between px-4 shadow-lg"
            style={{ backgroundColor: '#2ECC71' }}
            animate={{ scale: showSearch ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                animate={{ rotate: showSearch ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Search className="w-4 h-4" style={{ color: '#05361B' }} />
              </motion.div>
              <input
                type="text"
                placeholder="Where to?"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                  setShowSearch(e.target.value.length > 0)
                }}
                className="flex-1 bg-transparent border-none outline-none font-medium placeholder-gray-600"
                style={{ color: '#05361B', fontSize: 16 }}
              />
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={getUserLocation}
                disabled={isLocating}
                className="w-5 h-5 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                animate={isLocating ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: isLocating ? 1 : 0.2 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#05361B' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </motion.button>
              <span className="font-bold" style={{ color: '#05361B', fontSize: 16 }}>32 min</span>
            </div>
          </motion.div>
          
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-30 max-h-64 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        setSearchQuery(result.name)
                        setShowSearch(false)
                        setSearchResults([])
                        // Center map on result
                        if (mapRef.current && mapRef.current.getMap) {
                          const map = mapRef.current.getMap()
                          map.flyTo({
                            center: [result.lng, result.lat],
                            zoom: 15,
                            duration: 800,
                          })
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ backgroundColor: result.color }}>
                        {result.shortName}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{result.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{result.type}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        <Navigation className="w-3 h-3" />
                      </div>
                    </motion.button>
                  ))
                ) : searchQuery.length > 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No results found for "{searchQuery}"</div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="mx-2 mb-2 rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          {/* Handle */}
          <button onClick={() => setSheetOpen(!sheetOpen)} className="w-full flex items-center justify-center py-2">
            <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: '#2ECC71' }} />
          </button>
          
          {/* Sheet Content */}
          <div className={`overflow-hidden transition-all duration-300 ${sheetOpen ? 'h-80' : 'h-32'}`}>
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
              {selectedBus ? (
                /* Bus Info Panel */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Bus className="w-5 h-5 text-blue-500" />
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {routes.find(r => String(r.id) === String(selectedBus.route_id))?.short_name || 'Route'} • {selectedBus.plate_number || selectedBus.vehicle_number || selectedBus.id}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Passengers: {selectedBus.passengers || 0} / {selectedBus.max_capacity || 50}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBus(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">ETA</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {selectedBus.eta_minutes ? `${selectedBus.eta_minutes} min` : '—'}
                        </div>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Next Stop</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {selectedBus.next_stop || '—'}
                        </div>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Capacity</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {Math.round(((selectedBus.passengers || 0) / (selectedBus.max_capacity || 50)) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          ((selectedBus.passengers || 0) / (selectedBus.max_capacity || 50)) < 0.5 
                            ? 'bg-green-500' 
                            : ((selectedBus.passengers || 0) / (selectedBus.max_capacity || 50)) < 0.8 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(((selectedBus.passengers || 0) / (selectedBus.max_capacity || 50)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                allRoutes.map((route, idx) => (
                  <motion.button
                    key={route.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      // Center map on route
                      if (mapRef.current && mapRef.current.getMap && route.stops && route.stops.length > 0) {
                        const map = mapRef.current.getMap()
                        const bounds = route.stops.reduce((acc, stop) => {
                          return {
                            north: Math.max(acc.north, stop.lat),
                            south: Math.min(acc.south, stop.lat),
                            east: Math.max(acc.east, stop.lng),
                            west: Math.min(acc.west, stop.lng)
                          }
                        }, {
                          north: route.stops[0].lat,
                          south: route.stops[0].lat,
                          east: route.stops[0].lng,
                          west: route.stops[0].lng
                        })
                        
                        map.fitBounds([
                          [bounds.west, bounds.south],
                          [bounds.east, bounds.north]
                        ], {
                          padding: 50,
                          duration: 1000
                        })
                      }
                    }}
                    className="w-full relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: route.color }} />
                    <div className="flex items-center gap-4 pl-5 pr-4 py-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: route.color }}>
                        {route.short_name || route.shortName || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">{route.name || route.destination}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {route.stops?.length || 0} stops • {route.stops?.[0]?.name || 'Route'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {buses.filter(b => String(b.route_id) === String(route.id)).length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">buses</div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}













