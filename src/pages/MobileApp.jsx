"use client"

import { useState, useEffect } from "react"
import { Map, Star, Route, MapPin, MessageCircle, Home, Shield, CreditCard, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import MapMobile from "../mobile/MapMobile"
import PlannerMobile from "../mobile/PlannerMobile"
import NearbyMobile from "../mobile/NearbyMobile"
import FavoritesMobile from "../mobile/FavoritesMobile"
import FeedbackMobile from "../mobile/FeedbackMobile"
import TopUpMobile from "../mobile/TopUpMobile"
import LoginMobile from "../mobile/LoginMobile"

export default function MobileApp() {
  const [active, setActive] = useState('map')
  const [darkMode, setDarkMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem('addistransit_session')
        if (sessionData) {
          const session = JSON.parse(sessionData)
          if (session.expiresAt > Date.now()) {
            setIsLoggedIn(true)
            setUser({
              phoneNumber: session.phoneNumber,
              mengedId: session.mengedId,
              rememberMe: true
            })
          } else {
            localStorage.removeItem('addistransit_session')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('addistransit_session')
      }
    }

    checkSession()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
    setShowLogin(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('addistransit_session')
    setUser(null)
    setIsLoggedIn(false)
    setShowLogin(true)
  }

  const tabs = ['map', 'planner', 'nearby', 'favorites', 'topup', 'feedback']
  const activeIndex = tabs.indexOf(active)

  // Show login screen if not logged in
  if (!isLoggedIn || showLogin) {
    return <LoginMobile onLogin={handleLogin} />
  }

  return (
    <div className="mobile-shell h-screen w-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Header with user info and logout */}
      <div className="safe-screen h-16 glass-effect border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 mobile-slide-down">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mobile-shadow">
            <div className="font-bold text-white text-sm">AT</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {user?.mengedId || 'AddisTransit User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user?.phoneNumber || '+251 XXX XXX XXX'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mobile-button p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content area - reuse website pages, sized for phone */}
      <div className="relative h-[calc(100%-64px-64px)] overflow-hidden">
        <div className="absolute inset-0 mobile-scroll">
          {active === 'map' && <MapMobile darkMode={darkMode} setDarkMode={setDarkMode} user={user} />}
          {active === 'planner' && <PlannerMobile darkMode={darkMode} setDarkMode={setDarkMode} user={user} />}
          {active === 'nearby' && <NearbyMobile darkMode={darkMode} setDarkMode={setDarkMode} user={user} />}
          {active === 'favorites' && <FavoritesMobile darkMode={darkMode} setDarkMode={setDarkMode} user={user} />}
          {active === 'topup' && <TopUpMobile darkMode={darkMode} setDarkMode={setDarkMode} user={user} />}
          {active === 'feedback' && <FeedbackMobile user={user} />}
        </div>
      </div>

      {/* Bottom nav: Map, Planner, Nearby, Favorites, TopUp, Feedback */}
      <nav className="safe-screen h-16 glass-effect px-2 flex items-center justify-between relative mobile-slide-up">
        <div className="absolute left-2 right-2 top-2 bottom-2 pointer-events-none">
          <div
            className={`h-12 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 mobile-transition mobile-shadow`}
            style={{
              transform: `translateX(${activeIndex * (100/6)}%)`,
              width: `${100/6}%`
            }}
          />
        </div>
        <button onClick={() => setActive('map')} className={`mobile-button relative z-10 flex-1 flex flex-col items-center justify-center text-[10px] ${active==='map'?'text-emerald-600':'text-gray-500 dark:text-gray-400'}`}>
          <Map className="w-4 h-4 mb-0.5" />
          Map
        </button>
        <button onClick={() => setActive('planner')} className={`mobile-button relative z-10 flex-1 flex flex-col items-center justify-center text-[10px] ${active==='planner'?'text-emerald-600':'text-gray-500 dark:text-gray-400'}`}>
          <Route className="w-4 h-4 mb-0.5" />
          Planner
        </button>
        <button onClick={() => setActive('nearby')} className={`mobile-button relative z-10 flex-1 flex flex-col items-center justify-center text-[10px] ${active==='nearby'?'text-emerald-600':'text-gray-500 dark:text-gray-400'}`}>
          <MapPin className="w-4 h-4 mb-0.5" />
          Nearby
        </button>
        <button onClick={() => setActive('favorites')} className={`mobile-button relative z-10 flex-1 flex flex-col items-center justify-center text-[10px] ${active==='favorites'?'text-emerald-600':'text-gray-500 dark:text-gray-400'}`}>
          <Star className="w-4 h-4 mb-0.5" />
          Favorites
        </button>
        <button onClick={() => setActive('topup')} className={`mobile-button relative z-10 flex-1 flex flex-col items-center justify-center text-[10px] ${active==='topup'?'text-emerald-600':'text-gray-500 dark:text-gray-400'}`}>
          <CreditCard className="w-4 h-4 mb-0.5" />
          TopUp
        </button>
        <button onClick={() => setActive('feedback')} className={`mobile-button relative z-10 flex-1 flex flex-col items-center justify-center text-[10px] ${active==='feedback'?'text-emerald-600':'text-gray-500 dark:text-gray-400'}`}>
          <MessageCircle className="w-4 h-4 mb-0.5" />
          Feedback
        </button>
      </nav>
    </div>
  )
}