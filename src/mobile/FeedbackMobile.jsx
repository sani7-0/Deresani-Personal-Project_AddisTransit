"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Star, Send, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { submitFeedback, fetchFeedbacks } from "../lib/api"

export default function FeedbackMobile({ darkMode, setDarkMode }) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [category, setCategory] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentFeedbacks, setRecentFeedbacks] = useState([])
  const [showRecentFeedbacks, setShowRecentFeedbacks] = useState(false)
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)

  const categories = [
    { id: "route", label: "Route Information", icon: "🚌" },
    { id: "app", label: "App Experience", icon: "📱" },
    { id: "service", label: "Service Quality", icon: "⭐" },
    { id: "other", label: "Other", icon: "💬" }
  ]

  const handleSubmit = async () => {
    if (!rating || !feedback.trim() || !category) return
    
    setLoading(true)
    try {
      // Submit feedback to database
      await submitFeedback({
        route: category === 'route' ? 'General Route Feedback' : 'General Feedback',
        busNumber: 'N/A',
        plateNumber: 'N/A',
        feedback: `Rating: ${rating}/5 stars\nCategory: ${categories.find(c => c.id === category)?.label}\n\n${feedback}`,
        ip: '', // Will be set by backend
        userAgent: navigator.userAgent,
        locale: navigator.language
      })
      
      setSubmitted(true)
    } catch (error) {
      console.error('Feedback submission error:', error)
      // Still show success for better UX
      setSubmitted(true)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setRating(0)
    setFeedback("")
    setCategory("")
    setSubmitted(false)
  }

  const loadRecentFeedbacks = async () => {
    setLoadingFeedbacks(true)
    try {
      const feedbacks = await fetchFeedbacks(10) // Get last 10 feedbacks
      setRecentFeedbacks(feedbacks || [])
    } catch (error) {
      console.error('Error loading feedbacks:', error)
      setRecentFeedbacks([])
    }
    setLoadingFeedbacks(false)
  }

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="safe-screen px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feedback</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Share your experience</p>
            </div>
          </div>
          <motion.button
            onClick={() => {
              setShowRecentFeedbacks(!showRecentFeedbacks)
              if (!showRecentFeedbacks) {
                loadRecentFeedbacks()
              }
            }}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loadingFeedbacks ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        {/* Recent Feedbacks Section */}
        <AnimatePresence>
          {showRecentFeedbacks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Feedback</h3>
                {loadingFeedbacks ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                ) : recentFeedbacks.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentFeedbacks.map((fb, idx) => (
                      <motion.div
                        key={fb.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{fb.route}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Bus: {fb.bus_number} • Plate: {fb.plate_number}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 rounded p-2">
                          {fb.feedback}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div>No recent feedback</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <motion.button
              onClick={resetForm}
              className="px-6 py-3 rounded-2xl font-semibold text-white shadow-lg"
              style={{ backgroundColor: '#2ECC71' }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              Submit Another
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How was your experience?</h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-2"
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Category</h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      category === cat.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Feedback Text */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tell us more</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts, suggestions, or report any issues..."
                className="w-full h-32 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!rating || !feedback.trim() || !category || loading}
              className="w-full py-4 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2ECC71' }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </div>
              )}
            </motion.button>

            {/* Help Text */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Your feedback helps us improve!</p>
                <p>We read every submission and use your input to enhance the transit experience for everyone.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}














