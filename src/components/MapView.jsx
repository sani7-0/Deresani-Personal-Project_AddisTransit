"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import MapGL, { Marker, Popup, Source, Layer } from "@urbica/react-map-gl"
import { RotateCcw, Loader2, Route, Zap, RefreshCw, Settings, Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BusMarker from "./BusMarker"
import { fetchRoutesWithStops, fetchBuses, fetchEthiopianBuses, fetchBusesForRoute, getSimulationStatus, addBusToRoute, removeBus, openBusesSSE, fetchRouteGeometry, getSnappedRoute, getSnappedRouteOSRM, fetchBusStatus, fetchNearbyStops, fetchAlerts } from "../lib/api"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

const MapView = ({ selectedRoute, onRouteSelect, plannerFrom, plannerTo, onMapClick, selectedBus, onBusSelect }) => {
  const mapRef = useRef()
  const [viewState, setViewState] = useState({
    longitude: 38.7636, // Addis Ababa longitude
    latitude: 9.0054,   // Addis Ababa latitude
    zoom: 13,
  })
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [routeGeometries, setRouteGeometries] = useState([])
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/light-v11")
  const [isLoading, setIsLoading] = useState(true)
  const [isRecentering, setIsRecentering] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [useRoadSnapping, setUseRoadSnapping] = useState(true)
  const [isLoadingBuses, setIsLoadingBuses] = useState(false)
  const [simulationStatus, setSimulationStatus] = useState(null)
  const [showSimulationControls, setShowSimulationControls] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [nearbyStops, setNearbyStops] = useState([])
  const [circleRadius, setCircleRadius] = useState(10000) // 10km radius in meters
  const [alerts, setAlerts] = useState([])

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
  // Function to fetch alerts
  const loadAlerts = async () => {
    try {
      const alertsData = await fetchAlerts()
      setAlerts(alertsData || [])
      console.log('Loaded alerts:', alertsData)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  // Function to get alerts for a specific bus/route
  const getAlertsForBus = (bus) => {
    if (!bus || !alerts.length) {
      console.log('No alerts available:', { bus: !!bus, alertsLength: alerts.length })
      return []
    }
    
    const routeId = bus.route_id || bus.routeId
    const route = routes.find(r => r.id === routeId)
    const routeNumber = route?.route_number
    
    console.log('Checking alerts for bus:', { 
      routeId, 
      routeNumber, 
      totalAlerts: alerts.length,
      alerts: alerts.map(a => ({ id: a.id, affected_routes: a.affected_routes, is_active: a.is_active }))
    })
    
    const filteredAlerts = alerts.filter(alert => {
      // Check if alert affects this route by route number
      const affectsRoute = alert.affected_routes && (
        alert.affected_routes.includes(String(routeNumber)) ||
        alert.affected_routes.includes(routeNumber)
      )
      
      // Check if alert is active
      const isActive = alert.is_active !== false
      
      console.log('Alert check:', { 
        alertId: alert.id, 
        affectsRoute, 
        isActive, 
        affected_routes: alert.affected_routes,
        routeId,
        routeNumber
      })
      
      return affectsRoute && isActive
    })
    
    console.log('Filtered alerts for bus:', filteredAlerts)
    return filteredAlerts
  }

  // Function to create road-snapped geometry for database routes only
  const createSnappedRouteGeometry = async (routes, useSnapping = true) => {
    const snappedGeometries = []
    
    console.log(`Processing ${routes.length} routes for road snapping...`)
    console.log('Route data sample:', routes.slice(0, 2))
    
    // Only process routes that exist in the database and have valid stops
    for (const route of routes) {
      console.log(`Processing route ${route.id}:`, {
        hasStops: !!route.stops,
        stopsLength: route.stops?.length,
        hasId: !!route.id,
        hasShortName: !!route.short_name,
        hasName: !!route.name,
        hasColor: !!route.color,
        color: route.color
      })
      
      // Ensure route has valid stops data from database
      if (route.stops && route.stops.length >= 2 && route.id) {
        // Verify this is a real database route by checking if it has required fields
        const isDatabaseRoute = route.id && route.short_name && route.name && route.color
        
        // Validate that the color is one of the expected database colors
        const validColors = ['#FF0000', '#00BFFF', '#0000FF', '#00FF00', '#FFD700'] // Red, Light Blue, Blue, Green, Gold
        const hasValidColor = validColors.includes(route.color)
        
        if (isDatabaseRoute && hasValidColor) {
          if (useSnapping) {
            try {
              // Extract coordinates from database stops
              const coordinates = route.stops
                .filter(stop => stop.lat && stop.lng) // Ensure valid coordinates
                .map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
              
              if (coordinates.length >= 2) {
                // Try to get snapped route (use OSRM as it's free)
                const snappedGeometry = await getSnappedRouteOSRM(coordinates, 'driving')
                
                snappedGeometries.push({
                  route_id: route.id,
                  geometry: snappedGeometry.geometry,
                  color: route.color, // Use only the database color
                  properties: snappedGeometry.properties
                })
                
                console.log(`Road-snapped database route ${route.id} (${route.short_name}) with ${coordinates.length} stops`)
              } else {
                console.warn(`Route ${route.id} has insufficient valid coordinates for snapping`)
                // Fallback to straight line for routes with insufficient coordinates
                snappedGeometries.push({
                  route_id: route.id,
                  geometry: {
                    type: "LineString",
                    coordinates: route.stops.map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
                  },
                  color: route.color // Use only the database color
                })
              }
            } catch (error) {
              console.warn(`Failed to snap database route ${route.id}, using straight line:`, error)
              // Fallback to straight line geometry
              snappedGeometries.push({
                route_id: route.id,
                geometry: {
                  type: "LineString",
                  coordinates: route.stops.map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
                },
                color: route.color // Use only the database color
              })
            }
          } else {
            // Use straight line geometry for database routes when snapping is disabled
            snappedGeometries.push({
              route_id: route.id,
              geometry: {
                type: "LineString",
                coordinates: route.stops.map(stop => [parseFloat(stop.lng), parseFloat(stop.lat)])
              },
              color: route.color // Use only the database color
            })
          }
        } else if (isDatabaseRoute && !hasValidColor) {
          console.warn(`Skipping route ${route.id} - invalid color: ${route.color}. Expected one of: ${validColors.join(', ')}`)
        } else {
          console.warn(`Skipping non-database route: ${route.id} - missing required database fields`)
        }
      } else {
        console.warn(`Skipping route ${route.id} - insufficient stops data`)
      }
    }
    
    console.log(`Processed ${snappedGeometries.length} database routes for road snapping`)
    return snappedGeometries
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesData, busesData, alertsData] = await Promise.all([
          fetchRoutesWithStops(),
          fetchBusStatus(), // Use database buses instead of simulation
          fetchAlerts()
        ])
        
        setRoutes(routesData)
        setBuses(busesData)
        setAlerts(alertsData || [])
        
        console.log('Loaded data:', {
          routes: routesData.length,
          buses: busesData.length,
          alerts: (alertsData || []).length,
          alertsData: alertsData
        })
        
        // Debug alerts specifically
        if (alertsData && alertsData.length > 0) {
          console.log('Alerts loaded successfully:', alertsData)
        } else {
          console.warn('No alerts loaded or alerts is empty')
        }
        
        // Create road-snapped geometries for database routes only
        console.log(`Creating ${useRoadSnapping ? 'road-snapped' : 'straight-line'} geometries for database routes...`)
        const snappedGeometries = await createSnappedRouteGeometry(routesData, useRoadSnapping)
        setRouteGeometries(snappedGeometries)
        
        setIsLoading(false)
      } catch (e) {
        console.error('Failed to load map data:', e)
        setRoutes([])
        setBuses([])
        setRouteGeometries([])
        setAlerts([])
        setIsLoading(false)
      }
    }
    loadData()
  }, [useRoadSnapping])

  // Automatically get user location when map is loaded
  useEffect(() => {
    if (!mapLoaded) return

    const autoGetLocation = () => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser')
        setLocationError('Geolocation is not supported by this browser')
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
          
          console.log('User location detected automatically:', location)
          console.log('Centering map on:', longitude, latitude)
          
          // Update viewState directly to center on user location
          setViewState(prev => {
            const newState = {
              ...prev,
              longitude: longitude,
              latitude: latitude,
              zoom: 15
            }
            console.log('New viewState:', newState)
            return newState
          })

          // Fetch nearby stops
          fetchNearbyStopsForUser(latitude, longitude, circleRadius)

          // Also try using mapRef as a fallback
          setTimeout(() => {
            if (mapRef.current && mapRef.current.getMap) {
              console.log('Using mapRef to center on location')
              const map = mapRef.current.getMap()
              map.flyTo({
                center: [longitude, latitude],
                zoom: 15,
                duration: 2000,
                essential: true,
              })
            }
          }, 500)
        },
        (error) => {
          console.warn('Could not get user location automatically:', error)
          setLocationError('Location access denied. Using default view.')
          setIsLocating(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Longer timeout for automatic detection
          maximumAge: 300000 // 5 minutes
        }
      )
    }

    // Get location after map is loaded
    const timer = setTimeout(autoGetLocation, 1000)
    return () => clearTimeout(timer)
  }, [mapLoaded])

  // Update buses from database every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const busesData = await fetchBusStatus()
        setBuses(busesData)
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Failed to fetch buses:', error)
      }
    }, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleRecenter = useCallback(() => {
    if (mapRef.current && mapRef.current.getMap && !isRecentering) {
      setIsRecentering(true)
      const map = mapRef.current.getMap()
      map.flyTo({
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

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
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
        
        console.log('User location detected:', location)
      },
      (error) => {
        console.error('Error getting location:', error)
        setLocationError('Unable to get your location. Please check permissions.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [])

  // Fetch nearby stops for user location
  const fetchNearbyStopsForUser = useCallback(async (lat, lng, radius = circleRadius) => {
    try {
      console.log(`Fetching nearby stops within ${radius}m of ${lat}, ${lng}`)
      const stops = await fetchNearbyStops(lat, lng, radius)
      setNearbyStops(stops)
      console.log(`Found ${stops.length} nearby stops`)
    } catch (error) {
      console.error('Failed to fetch nearby stops:', error)
      setNearbyStops([])
    }
  }, [circleRadius])

  // Center on user location
  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 15
      }))
    } else {
      getUserLocation()
    }
  }, [userLocation, getUserLocation])

  const handleRefreshBuses = useCallback(async () => {
    if (isLoadingBuses) return
    
    setIsLoadingBuses(true)
    try {
      console.log('Refreshing database bus data...')
      const busesData = await fetchBusStatus()
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
      if (onBusSelect) {
        onBusSelect(bus)
      }
      
      const route = routes.find((r) => r.id === bus.route_id)
      if (route && onRouteSelect) {
        onRouteSelect(route)
      }

      if (mapRef.current && mapRef.current.getMap) {
        const map = mapRef.current.getMap()
        map.flyTo({
          center: [bus.lng, bus.lat],
          zoom: Math.max(viewState.zoom, 15),
          duration: 800,
        })
      }
    },
    [onBusSelect, onRouteSelect, viewState.zoom, routes]
  )

  const filteredBuses = selectedRoute ? buses.filter((bus) => String(bus.route_id) === String(selectedRoute.id)) : buses

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {(isLoading || isLocating) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLocating ? 'Getting your location...' : 'Loading transit data...'}
              </p>
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
        onLoad={() => {
          setIsLoading(false)
          setMapLoaded(true)
        }}
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
                  "line-color": routeGeom.color, // Use only database color
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
              key={bus.bus_id}
              bus={{
                ...bus,
                id: bus.bus_id,
                lat: bus.last_lat,
                lng: bus.last_lng,
                vehicle_number: bus.plate_number,
                speed: 0, // Database buses don't have speed, set to 0
                heading: 0, // Database buses don't have heading, set to 0
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
              isSelected={selectedBus?.id === bus.bus_id}
            />
          ))}
        </AnimatePresence>


        {/* User location circle and marker */}
        {userLocation && (
          <>
            {/* Circle around user location */}
            <Source
              key={`user-circle-source-${Date.now()}`}
              id={`user-location-circle-${userLocation.lng}-${userLocation.lat}`}
              type="geojson"
              data={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [userLocation.lng, userLocation.lat]
                },
                properties: {
                  radius: circleRadius
                }
              }}
            >
              {/* Main yellow circle */}
              <Layer
                key={`user-circle-layer-${Date.now()}`}
                id={`user-location-circle-layer-${userLocation.lng}-${userLocation.lat}`}
                type="circle"
                source={`user-location-circle-${userLocation.lng}-${userLocation.lat}`}
                paint={{
                  "circle-radius": {
                    stops: [
                      [0, 0],
                      [20, circleRadius]
                    ],
                    base: 2
                  },
                  "circle-color": "#fbbf24", // Bright yellow
                  "circle-opacity": 0.3, // More visible
                  "circle-stroke-color": "#f59e0b", // Darker yellow border
                  "circle-stroke-width": 4, // Thick border
                  "circle-stroke-opacity": 0.8 // Very visible border
                }}
              />
            </Source>

            {/* User location marker */}
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Outer pulse ring */}
                <motion.div
                  className="absolute inset-0 w-8 h-8 rounded-full border-2 border-blue-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                {/* Inner pulse ring */}
                <motion.div
                  className="absolute inset-0 w-6 h-6 rounded-full border-2 border-blue-400"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
                {/* Center dot */}
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </motion.div>
            </Marker>
          </>
        )}

        {/* Nearby stops markers */}
        {nearbyStops.map((stop) => (
          <Marker key={stop.id} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
            <motion.div
              className="relative cursor-pointer"
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.1 }}
              title={`${stop.name} - ${stop.route_short_name || stop.route_name}`}
            >
              {/* Stop marker */}
              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full border-2 border-green-500 shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              {/* Route color indicator */}
              <div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                style={{ backgroundColor: stop.route_color || '#3b82f6' }}
              />
            </motion.div>
          </Marker>
        ))}

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

      {/* Refresh user location button */}
      <motion.button
        onClick={centerOnUserLocation}
        disabled={isLocating}
        className="absolute bottom-6 right-6 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-full shadow-lg border border-blue-600 flex items-center justify-center transition-colors z-10 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isLocating ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: isLocating ? 1 : 0.2 }}
        aria-label="Refresh my location"
        title="Refresh and center on your location"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </motion.button>

      {/* Recenter to Addis Ababa button */}
      <motion.button
        onClick={handleRecenter}
        disabled={isRecentering}
        className="absolute bottom-6 right-20 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isRecentering ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: isRecentering ? 1.2 : 0.2 }}
        aria-label="Recenter to Addis Ababa"
        title="Center on Addis Ababa"
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
        className={`absolute bottom-6 right-32 w-12 h-12 rounded-full shadow-lg border flex items-center justify-center transition-colors z-10 ${
          useRoadSnapping 
            ? 'bg-green-500 hover:bg-green-600 border-green-600 text-white' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={useRoadSnapping ? "Disable road snapping" : "Enable road snapping"}
        title={useRoadSnapping ? "Road snapping enabled - database routes follow roads" : "Road snapping disabled - straight lines between database stops"}
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
        className="absolute bottom-6 right-44 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-full shadow-lg border border-blue-600 flex items-center justify-center transition-colors z-10 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isLoadingBuses ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: isLoadingBuses ? 1 : 0.2 }}
        aria-label="Refresh bus locations"
        title="Refresh database bus locations"
      >
        <RefreshCw className="w-5 h-5 text-white" />
      </motion.button>

      {/* Simulation controls toggle */}
      <motion.button
        onClick={() => setShowSimulationControls(!showSimulationControls)}
        className="absolute bottom-6 right-56 w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full shadow-lg border border-gray-500 flex items-center justify-center transition-colors z-10"
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
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Database</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {buses.length} buses | {Math.floor((new Date() - lastUpdate) / 1000)}s ago
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Real-time bus tracking
        </div>
        {userLocation && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {nearbyStops.length} stops within {(circleRadius / 1000).toFixed(1)}km
          </div>
        )}
      </motion.div>

      {/* Circle radius control */}
      {userLocation && (
        <motion.div
          className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 z-10 min-w-48"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
            Search Radius
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1000"
              max="5000"
              step="250"
              value={circleRadius}
              onChange={(e) => {
                const newRadius = parseInt(e.target.value)
                setCircleRadius(newRadius)
                fetchNearbyStopsForUser(userLocation.lat, userLocation.lng, newRadius)
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-12">
              {(circleRadius / 1000).toFixed(1)}km
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {nearbyStops.length} stops found
          </div>
        </motion.div>
      )}

      {/* Location error notification - subtle */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            className="absolute top-4 right-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg px-3 py-2 z-20 max-w-xs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-yellow-500 flex-shrink-0">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-yellow-700 dark:text-yellow-300">{locationError}</div>
              </div>
              <button
                onClick={() => setLocationError(null)}
                className="text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MapView
