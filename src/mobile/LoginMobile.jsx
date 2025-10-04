"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { sendOtp, verifyOtp, resendOtp } from "../lib/api"
import { Phone, Key, CheckCircle, AlertCircle, Loader } from "lucide-react"

export default function LoginMobile({ onLogin }) {
  const [step, setStep] = useState('phone') // 'phone', 'otp'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)

  // OTP countdown timer
  useEffect(() => {
    let interval = null
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1)
      }, 1000)
    } else if (otpTimer === 0) {
      setOtpSent(false)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  const validatePhoneNumber = (phone) => {
    const s = phone.replace(/\s/g, '')
    // Accept E.164 globally or Ethiopian formats
    const e164 = /^\+[1-9]\d{7,14}$/
    const ethiopian = /^(\+251|0)?[79]\d{8}$/
    return e164.test(s) || ethiopian.test(s)
  }

  const formatPhoneNumber = (phone) => {
    const raw = phone.replace(/\s/g, '')
    if (/^\+[1-9]\d{7,14}$/.test(raw)) return raw
    const cleaned = raw.replace(/\D/g, '')
    if (cleaned.startsWith('251')) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
    } else if (cleaned.startsWith('0')) {
      return `+251 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
    }
    return phone
  }

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Ethiopian phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await sendOtp(phoneNumber)

      if (result && result.success) {
        setOtpSent(true)
        setOtpTimer(result.expires_in || 300)
        setStep('otp')
      } else {
        setError((result && result.error) || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      console.error('OTP send error:', err)
      setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await verifyOtp(phoneNumber, otp)

      if (result && result.success) {
        // Store login session if remember me is checked
        if (rememberMe) {
          const sessionData = {
            phoneNumber: phoneNumber,
            mengedId: result.menged_id,
            loginTime: Date.now(),
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
          }
          localStorage.setItem('addistransit_session', JSON.stringify(sessionData))
        }
        
        onLogin({
          phoneNumber: phoneNumber,
          mengedId: result.menged_id,
          rememberMe: rememberMe
        })
      } else {
        setError((result && result.error) || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('OTP verification failed. Please try again.')
    }
    setLoading(false)
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await resendOtp(phoneNumber)

      if (result && result.success) {
        setOtpTimer(result.expires_in || 300)
        setOtpSent(true)
      } else {
        setError((result && result.error) || 'Failed to resend OTP. Please try again.')
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <div className="font-bold text-2xl text-white">AT</div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to AddisTransit
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'phone' && 'Enter your phone number to continue'}
            {step === 'otp' && 'Enter the OTP sent to your phone'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            {['phone', 'otp'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === stepName
                      ? 'bg-green-500 text-white'
                      : ['phone', 'otp'].indexOf(step) > index
                      ? 'bg-green-200 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      ['phone', 'otp'].indexOf(step) > index
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Phone Number Step */}
          <AnimatePresence>
            {step === 'phone' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+251 9X XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  />
                </div>
                <motion.button
                  onClick={handleSendOTP}
                  disabled={loading || !validatePhoneNumber(phoneNumber)}
                  className="w-full py-4 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#2ECC71' }}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </div>
                  ) : (
                    'Send OTP'
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP Step */}
          <AnimatePresence>
            {step === 'otp' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    OTP sent to {formatPhoneNumber(phoneNumber)}
                  </p>
                  {otpTimer > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Resend OTP in {otpTimer}s
                    </p>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Key className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg text-center tracking-widest"
                  />
                </div>
                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Remember me for 30 days
                    </span>
                  </label>
                </div>

                <motion.button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full py-4 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#2ECC71' }}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Logging in...
                    </div>
                  ) : (
                    'Login'
                  )}
                </motion.button>
                {otpTimer === 0 && (
                  <motion.button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="w-full py-2 text-green-600 dark:text-green-400 font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    Resend OTP
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
