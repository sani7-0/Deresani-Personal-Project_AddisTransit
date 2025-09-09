"use client"

import { NavLink } from "react-router-dom"

const TopBar = ({ offsetLeft = 0, leftAddon = null, containerStyle, containerClassName = "" }) => {
  const navItems = [
    { path: "/", label: "Map", openSidebarOnMap: true },
    { path: "/trip-planner", label: "Trip Planner" },
    { path: "/nearby", label: "Nearby" },
    { path: "/favorites", label: "Favorites" },
    { path: "/alerts", label: "Alerts" },
  ]

  return (
    <div
      className={`sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60 ${containerClassName}`}
      style={{ paddingLeft: offsetLeft, ...(containerStyle || {}) }}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {leftAddon}
          {navItems.map((item) => (
            <NavLink
              key={`topbar-${item.path}`}
              to={item.path}
              onClick={() => {
                if (item.openSidebarOnMap) {
                  try {
                    localStorage.setItem("openSidebarOnMap", "1")
                  } catch (_) {}
                }
              }}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors border shadow-sm ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent"
                }`
              }
            >
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopBar


