"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import ErrorBoundary from "./components/ErrorBoundary"

import MapPage from "./pages/MapPage"
import LandingPage from "./pages/LandingPage"
import FeedbackPage from "./pages/FeedbackPage"
import AdminLoginPage from "./pages/AdminLoginPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import TripPlannerPage from "./pages/TripPlannerPage"
import NearbyPage from "./pages/NearbyPage"
import FavoritesPage from "./pages/FavoritesPage"
import AlertsPage from "./pages/AlertsPage"
import SettingsPage from "./pages/SettingsPage"
import AboutPage from "./pages/AboutPage"
import CoordinatorInterface from "./components/CoordinatorInterface"
import DriverDashboard from "./components/DriverDashboard"
import MobileApp from "./pages/MobileApp"

function App() {
  // Force mobile shell: always route mobile UA to /m
  useEffect(() => {
    try {
      const ua = navigator.userAgent.toLowerCase()
      const isMobile = /android|iphone|ipad|ipod/.test(ua)
      if (isMobile && !window.location.pathname.startsWith('/m')) {
        window.location.replace('/m')
      }
    } catch (_) {}
  }, [])
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("transit-dark-mode")
    if (saved !== null) {
      return JSON.parse(saved)
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("transit-dark-mode", JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e) => {
      const saved = localStorage.getItem("transit-dark-mode")
      if (saved === null) {
        setDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900 flex">
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/m" element={<MobileApp />} />
              <Route path="/map" element={<MapPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/coordinator" element={<CoordinatorInterface />} />
              <Route path="/driver" element={<DriverDashboard />} />
              <Route path="/about" element={<AboutPage />} />
              <Route
                path="/trip-planner"
                element={<TripPlannerPage darkMode={darkMode} setDarkMode={setDarkMode} />}
              />
              <Route
                path="/nearby"
                element={<NearbyPage darkMode={darkMode} setDarkMode={setDarkMode} />}
              />
              <Route
                path="/favorites"
                element={<FavoritesPage darkMode={darkMode} setDarkMode={setDarkMode} />}
              />
              <Route
                path="/alerts"
                element={<AlertsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
              />
              <Route
                path="/settings"
                element={<SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
              />
            </Routes>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App