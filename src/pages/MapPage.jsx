"use client"

import { useState, useEffect } from "react"
import MapView from "../components/MapView"
import Sidebar from "../components/Sidebar"
import TopBar from "../components/TopBar"
import DarkModeToggle from "../components/DarkModeToggle"

const MapPage = ({ darkMode, setDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedBus, setSelectedBus] = useState(null)

  // If navigated via TopBar "Map" button, ensure sidebar opens
  useEffect(() => {
    try {
      const shouldOpen = localStorage.getItem("openSidebarOnMap") === "1"
      if (shouldOpen) {
        setSidebarOpen(true)
        localStorage.removeItem("openSidebarOnMap")
      }
    } catch (_) {}
  }, [])

  return (
    <div className="h-full w-full relative">
      {/* Top Bar under the sidebar only on homepage */}
      {sidebarOpen && (
        <div className="absolute left-[400px] right-0 top-0 z-20">
          <TopBar
            offsetLeft={0}
            leftAddon={null}
            containerClassName="relative top-[88px]"
          />
        </div>
      )}
      {!sidebarOpen && (
        <TopBar
          offsetLeft={0}
          leftAddon={
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent shadow-sm"
              aria-label="Open sidebar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span className="font-medium">Open</span>
            </button>
          }
        />
      )}
      
      {/* Desktop Sidebar Content */}
      <div className="absolute left-0 top-0 bottom-0 w-[400px] z-10">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRoute}
          selectedBus={selectedBus}
          onBusSelect={setSelectedBus}
        />
      </div>

      {/* Main Map Container */}
      <div className={`h-full transition-all duration-300 ${sidebarOpen ? "ml-[400px]" : "ml-0"}`}>
        {/* Map */}
        <MapView 
          selectedRoute={selectedRoute} 
          onRouteSelect={setSelectedRoute}
          selectedBus={selectedBus}
          onBusSelect={setSelectedBus}
        />

        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </div>
      </div>
    </div>
  )
}

export default MapPage