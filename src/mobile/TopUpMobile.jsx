"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Smartphone, Wallet, CheckCircle, AlertCircle, Loader, Building2 } from "lucide-react"

export default function TopUpMobile({ darkMode, setDarkMode, user }) {
  const [selectedMethod, setSelectedMethod] = useState('bank')
  const [amount, setAmount] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Predefined amounts for Menged card top-up
  const quickAmounts = [25, 50, 100, 200, 500, 1000]

  // Top-up methods for Menged card
  const topUpMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Transfer from your bank account to Menged card',
      color: '#2ECC71',
      logo: '🏦' // Bank logo
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with your bank card',
      color: '#007AFF',
      logo: '💳' // Card logo
    },
    {
      id: 'telebirr',
      name: 'Telebirr',
      icon: Smartphone,
      description: 'Pay using Telebirr mobile payment',
      color: '#FF6B6B',
      logo: '📱' // Telebirr logo
    }
  ]

  const handleTopUp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (selectedMethod === 'card' && (!cardNumber || !expiryDate || !cvv)) {
      setError('Please fill in all card details')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Redirect to blank webpage for bank and telebirr
      if (selectedMethod === 'bank') {
        window.open('about:blank', '_blank')
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setAmount('')
        }, 3000)
        setLoading(false)
        return
      }

      if (selectedMethod === 'telebirr') {
        window.open('about:blank', '_blank')
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setAmount('')
        }, 3000)
        setLoading(false)
        return
      }

      // For card method, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock success response
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setAmount('')
        setCardNumber('')
        setExpiryDate('')
        setCvv('')
      }, 3000)
    } catch (err) {
      setError('Top-up failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="safe-screen px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center">
            {/* Menged Logo - using a stylized M */}
            <div className="font-bold text-lg">M</div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AddisTransit Top-Up</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add credit to your Menged card
            </p>
            {user?.mengedId && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                Card ID: {user.mengedId}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Top-Up Method</h3>
          <div className="space-y-3">
            {topUpMethods.map((method) => {
              const Icon = method.icon
              return (
                <motion.button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: method.color }}
                    >
                      <div className="text-2xl">{method.logo}</div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{method.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{method.description}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      selectedMethod === method.id
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedMethod === method.id && (
                        <CheckCircle className="w-4 h-4 text-white m-0.5" />
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Amount</h3>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {quickAmounts.map((quickAmount) => (
              <motion.button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                  amount === quickAmount.toString()
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {quickAmount} ETB
              </motion.button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="relative">
            <input
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
              ETB
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <AnimatePresence>
          {selectedMethod === 'card' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Card Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {selectedMethod === 'bank' ? 'Redirected to bank transfer page' : 
                   selectedMethod === 'telebirr' ? 'Redirected to Telebirr payment page' : 
                   `Menged card topped up successfully! ${amount} ETB added to your card.`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Up Button */}
        <motion.button
          onClick={handleTopUp}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full py-4 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#2ECC71' }}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              {selectedMethod === 'bank' ? 'Redirecting to bank...' : 
               selectedMethod === 'telebirr' ? 'Redirecting to Telebirr...' : 
               'Topping up Menged card...'}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="font-bold text-lg">M</div>
              {selectedMethod === 'bank' ? 'Continue to Bank Transfer' : 
               selectedMethod === 'telebirr' ? 'Continue to Telebirr' : 
               `Top Up Menged Card ${amount ? `${amount} ETB` : ''}`}
            </div>
          )}
        </motion.button>

        {/* Transaction History */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Menged Top-Ups</h3>
          <div className="space-y-3">
            {[
              { id: 1, amount: 100, method: 'Bank Transfer', date: '2024-01-15', status: 'Completed' },
              { id: 2, amount: 200, method: 'Credit Card', date: '2024-01-10', status: 'Completed' },
              { id: 3, amount: 50, method: 'Telebirr', date: '2024-01-05', status: 'Completed' }
            ].map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center">
                      <div className="font-bold text-sm">M</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {transaction.amount} ETB
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.method} • {transaction.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
