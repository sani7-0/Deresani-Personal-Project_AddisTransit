import React, { useState, useEffect } from 'react'
import MapGL, { Source, Layer } from '@urbica/react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const CongestionHeatmap = ({ congestionData, onLocationClick, selectedLocation }) => {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [viewState, setViewState] = useState({
    longitude: 38.7756, // Addis Ababa center
    latitude: 9.0192,
    zoom: 11
  })

  // Use congestion data from props, with fallback to mock data
  const dataToUse = congestionData && congestionData.length > 0 ? congestionData : [
    { lng: 38.7756, lat: 9.0192, intensity: 0.9, area: 'Meskel Square' },
    { lng: 38.7600, lat: 9.0100, intensity: 0.7, area: 'CMC' },
    { lng: 38.7900, lat: 9.0300, intensity: 0.8, area: 'Bole' },
    { lng: 38.7500, lat: 9.0000, intensity: 0.6, area: 'Piazza' },
    { lng: 38.7800, lat: 9.0400, intensity: 0.5, area: 'Kazanchis' },
    { lng: 38.7400, lat: 8.9900, intensity: 0.4, area: 'Merkato' },
    { lng: 38.8000, lat: 9.0500, intensity: 0.3, area: 'Airport' },
    { lng: 38.7200, lat: 8.9800, intensity: 0.2, area: 'Arat Kilo' }
  ]

  // Convert congestion data to GeoJSON for heatmap
  const heatmapData = {
    type: 'FeatureCollection',
    features: dataToUse.map((point, index) => ({
      type: 'Feature',
      properties: {
        intensity: point.intensity,
        area: point.area,
        id: index
      },
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      }
    }))
  }

  const handleMapClick = (event) => {
    const { lngLat } = event
    const clickedPoint = {
      lng: lngLat.lng,
      lat: lngLat.lat
    }
    
    // Find the closest congestion point
    let closestPoint = null
    let minDistance = Infinity
    
    dataToUse.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(point.lng - lngLat.lng, 2) + Math.pow(point.lat - lngLat.lat, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    })
    
    if (closestPoint && onLocationClick) {
      onLocationClick(closestPoint)
    }
  }

  const getIntensityColor = (intensity) => {
    if (intensity >= 0.8) return '#ff0000' // Red - High congestion
    if (intensity >= 0.6) return '#ff8800' // Orange - Medium-high
    if (intensity >= 0.4) return '#ffaa00' // Yellow - Medium
    if (intensity >= 0.2) return '#88ff00' // Light green - Low
    return '#00ff00' // Green - Very low
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapGL
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        longitude={viewState.longitude}
        latitude={viewState.latitude}
        zoom={viewState.zoom}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
      >
        {/* Congestion Heatmap */}
        <Source
          id="congestion-heatmap"
          type="geojson"
          data={heatmapData}
        >
          <Layer
            id="congestion-heatmap-layer"
            type="heatmap"
            source="congestion-heatmap"
            paint={{
              'heatmap-weight': {
                property: 'intensity',
                type: 'exponential',
                stops: [
                  [0, 0],
                  [1, 1]
                ]
              },
              'heatmap-intensity': {
                stops: [
                  [0, 0],
                  [1, 1]
                ]
              },
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 255, 0, 0)',
                0.1, 'rgba(0, 255, 0, 0.5)',
                0.3, 'rgba(255, 255, 0, 0.5)',
                0.5, 'rgba(255, 165, 0, 0.5)',
                0.7, 'rgba(255, 0, 0, 0.5)',
                1, 'rgba(255, 0, 0, 0.8)'
              ],
              'heatmap-radius': {
                stops: [
                  [0, 2],
                  [1, 20]
                ]
              },
              'heatmap-opacity': 0.6
            }}
          />
        </Source>

        {/* Individual congestion points */}
        <Source
          id="congestion-points"
          type="geojson"
          data={heatmapData}
        >
          <Layer
            id="congestion-points-layer"
            type="circle"
            source="congestion-points"
            paint={{
              'circle-radius': {
                property: 'intensity',
                stops: [
                  [0, 4],
                  [1, 12]
                ]
              },
              'circle-color': {
                property: 'intensity',
                stops: [
                  [0, '#00ff00'],
                  [0.2, '#88ff00'],
                  [0.4, '#ffaa00'],
                  [0.6, '#ff8800'],
                  [0.8, '#ff0000']
                ]
              },
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.8
            }}
          />
        </Source>

        {/* Selected location marker */}
        {selectedLocation && (
          <Source
            id="selected-location"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [selectedLocation.lng, selectedLocation.lat]
              }
            }}
          >
            <Layer
              id="selected-location-layer"
              type="circle"
              source="selected-location"
              paint={{
                'circle-radius': 15,
                'circle-color': '#0066ff',
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.8
              }}
            />
          </Source>
        )}
      </MapGL>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold mb-2">Congestion Level</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs">High (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-xs">Medium-High (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-xs">Medium (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs">Low (0-40%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CongestionHeatmap
