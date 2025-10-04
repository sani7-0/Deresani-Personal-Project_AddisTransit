"use client"
import { useEffect, useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { fetchNearbyStops } from "../lib/api"

export default function RouteCardsPanel({ userLocation }) {
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const apiStops = await fetchNearbyStops(userLocation.lat, userLocation.lng, 1200)
      const mapped = (apiStops || []).map((s, i) => ({
        id: s.id || `stop-${i}`,
        routeShortName: s.route_short_name || s.routeShortName || "?",
        destination: s.route_name || s.routeName || "",
        stopInfo: s.name || "",
        color: s.route_color || "#3B82F6",
        eta: (s.next_arrivals && s.next_arrivals[0]) || (s.nextArrivals && s.nextArrivals[0]) || "-- min",
      }))
      setStops(mapped)
    } catch (_e) {
      setStops([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng])

  const cards = useMemo(() => stops.slice(0, 30), [stops])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-500 dark:text-gray-400">
        Loading…
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MapPin className="w-10 h-10 text-gray-400 mb-2" />
        <div className="text-sm text-gray-500 dark:text-gray-400">No nearby routes found</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {cards.map((c, idx) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
          className="relative bg-white dark:bg-gray-900 rounded-[16px] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-shadow"
        >
          <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: c.color }} />
          <div className="flex items-center gap-4 pl-6 pr-4 py-4">
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-white font-bold text-[20px]" style={{ backgroundColor: c.color }}>
              {c.routeShortName}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: 20 }}>{c.destination}</div>
              <div className="text-gray-500 dark:text-gray-400 truncate" style={{ fontSize: 14 }}>{c.stopInfo}</div>
            </div>
            <div className="text-right leading-none">
              <div className="font-bold text-gray-900 dark:text-gray-100" style={{ fontSize: 28 }}>{String(c.eta).replace(/\D/g, '') || '--'}</div>
              <div className="text-gray-500 dark:text-gray-400" style={{ fontSize: 12 }}>min</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}


