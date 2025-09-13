"use client"
import { Marker } from "@urbica/react-map-gl"
import { motion, AnimatePresence } from "framer-motion"

const BusMarker = ({ bus, route, onClick, isSelected }) => {
  return (
    <Marker longitude={bus.lng} latitude={bus.lat}>
      <motion.div
        className="relative cursor-pointer group"
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: isSelected ? 1.2 : 1,
          rotate: 0,
        }}
        whileHover={{ scale: isSelected ? 1.3 : 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          scale: { duration: 0.3 },
        }}
        layout
        onClick={onClick}
        title={`Click to view details for ${route?.shortName || 'Bus'} ${bus.vehicle_number || bus.id}`}
      >
        {/* Bus icon container */}
        <motion.div
          className={`w-12 h-12 rounded-xl shadow-xl border-2 border-white flex items-center justify-center relative transition-all duration-200 ${
            isSelected ? "ring-2 ring-white ring-opacity-50" : ""
          } group-hover:shadow-2xl group-hover:scale-105`}
          style={{ backgroundColor: route?.color || "#0ea5e9" }}
          animate={{
            boxShadow: isSelected
              ? "0 8px 25px rgba(0, 0, 0, 0.3)"
              : "0 4px 15px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Bus icon */}
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
            animate={{ scale: bus.speed > 0 ? [1, 1.1, 1] : 1 }}
            transition={{
              duration: 1,
              repeat: bus.speed > 0 ? Number.POSITIVE_INFINITY : 0,
            }}
          >
            <path
              d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10Z"
              fill="currentColor"
            />
            <circle cx="6.5" cy="15.5" r="1.5" fill="white" />
            <circle cx="17.5" cy="15.5" r="1.5" fill="white" />
            <path d="M4 7h16v5H4V7Z" fill="white" fillOpacity="0.3" />
          </motion.svg>

          {/* Direction indicator */}
          <motion.div
            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border border-gray-300 flex items-center justify-center"
            animate={{
              rotate: bus.heading,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              transformOrigin: "center",
            }}
          >
            <div className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
          </motion.div>

          {/* Speed indicator for moving buses */}
          {bus.speed > 5 && (
            <motion.div
              className="absolute -top-2 -left-2 w-2 h-2 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>

        {/* Removed black badge from map; shown in Trip Planner instead */}

        {/* Route label */}
        <AnimatePresence>
          <motion.div
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium shadow-md border border-gray-200 dark:border-gray-700 whitespace-nowrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-gray-900 dark:text-gray-100">
              {route?.shortName || "BUS"}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Pulse animation for active buses */}
        {bus.speed > 0 && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2"
            style={{ borderColor: route?.color || "#0ea5e9" }}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Selection ring */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-white"
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </Marker>
  )
}

export default BusMarker
