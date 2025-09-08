"use client"

import { useState } from "react"
import { Search, MapPin } from "lucide-react"

const SearchBar = ({ onRouteSelect, onLocationSelect }) => {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)

  const locations = [
    { name: "Downtown Transit Center", address: "Main St & 1st Ave", type: "stop" },
    { name: "Union Square", address: "Powell St & Geary St", type: "stop" },
    { name: "Great Theatre", address: "Theatre District", type: "landmark" },
    { name: "Athens Chapel", address: "Demetrius St / Hermia St", type: "landmark" },
    { name: "Puck's Pharmacy", address: "Queen St / King St", type: "business" },
  ]

  const routes = [
    { number: "38", name: "Southbound to Glade", color: "blue" },
    { number: "91", name: "Theatre District", color: "yellow" },
    { number: "12", name: "Athens Chapel", color: "green" },
    { number: "23", name: "Downtown Express", color: "blue" },
  ]

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase()),
  )

  const filteredRoutes = routes.filter(
    (route) => route.number.includes(query) || route.name.toLowerCase().includes(query.toLowerCase()),
  )

  const handleRouteSelect = (route) => {
    setQuery(`Route ${route.number} - ${route.name}`)
    setFocused(false)
    onRouteSelect?.(route)
  }

  const handleLocationSelect = (location) => {
    setQuery(location.name)
    setFocused(false)
    onLocationSelect?.(location)
  }

  return (
    <div className="relative">
      <div
        className={`glass-effect rounded-xl transition-all duration-200 ${
          focused ? "ring-2 ring-green-500 ring-opacity-50" : ""
        }`}
      >
        <div className="flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Where to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
          />
          <MapPin className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      </div>

      {focused && query && (filteredRoutes.length > 0 || filteredLocations.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-effect rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {/* Route suggestions */}
            {filteredRoutes.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Routes
                </div>
                {filteredRoutes.map((route) => (
                  <div
                    key={route.number}
                    onClick={() => handleRouteSelect(route)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3 ${
                          route.color === "blue"
                            ? "bg-blue-500"
                            : route.color === "yellow"
                              ? "bg-yellow-500"
                              : route.color === "green"
                                ? "bg-green-500"
                                : "bg-gray-500"
                        }`}
                      >
                        {route.number}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Route {route.number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{route.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Location suggestions */}
            {filteredLocations.length > 0 && (
              <>
                {filteredRoutes.length > 0 && <div className="border-t border-gray-200 dark:border-gray-700 my-2" />}
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Locations
                </div>
                {filteredLocations.map((location, index) => (
                  <div
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{location.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{location.address}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
