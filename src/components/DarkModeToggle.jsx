"use client"

import { Sun, Moon } from "lucide-react"
import { motion } from "framer-motion"

const DarkModeToggle = ({ darkMode, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      className="w-12 h-12 glass-effect rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
      </motion.div>
    </motion.button>
  )
}

export default DarkModeToggle
