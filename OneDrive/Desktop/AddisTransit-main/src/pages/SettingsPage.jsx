"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Bell, Globe, Shield, HelpCircle, Info, LogOut, Camera, Edit3, Wifi } from "lucide-react"
import DarkModeToggle from "../components/DarkModeToggle"

const SettingsPage = ({ darkMode, setDarkMode }) => {
  const [userProfile, setUserProfile] = useState({
    name: "Alemayehu Tesfaye",
    email: "alemayehu.tesfaye@email.com",
    avatar: null,
    joinDate: "March 2024",
  })

  const [settings, setSettings] = useState({
    notifications: {
      pushNotifications: true,
      serviceAlerts: true,
      arrivalReminders: true,
      weeklyDigest: false,
    },
    preferences: {
      language: "en",
      units: "metric",
      walkingSpeed: "normal",
      accessibilityMode: false,
      showCrowding: true,
      autoRefresh: true,
    },
    privacy: {
      locationTracking: true,
      analyticsSharing: false,
      crashReporting: true,
    },
    offline: {
      downloadMaps: false,
      offlineSchedules: true,
      dataUsage: "wifi-only",
    },
  })

  const [editingProfile, setEditingProfile] = useState(false)
  const [tempName, setTempName] = useState(userProfile.name)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("transit-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const updateSetting = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    }
    setSettings(newSettings)
    localStorage.setItem("transit-settings", JSON.stringify(newSettings))
  }

  const saveProfile = () => {
    setUserProfile({ ...userProfile, name: tempName })
    setEditingProfile(false)
    // In a real app, this would sync with a backend
  }

  const SettingToggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )

  const SettingSelect = ({ label, description, value, options, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const SettingButton = ({ label, description, icon: Icon, onClick, rightText, danger = false }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
        danger
          ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${danger ? "text-red-500" : "text-gray-400"}`} />
        <div className="text-left">
          <h4 className={`font-medium ${danger ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
            {label}
          </h4>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
      {rightText && <span className="text-sm text-gray-500">{rightText}</span>}
    </button>
  )

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar || "/placeholder.svg"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>

            <div className="flex-1">
              {editingProfile ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-lg font-semibold bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveProfile}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false)
                        setTempName(userProfile.name)
                      }}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{userProfile.name}</h2>
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{userProfile.email}</p>
                  <p className="text-xs text-gray-400">Member since {userProfile.joinDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 p-4">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>

            <div className="space-y-1">
              <SettingToggle
                label="Push Notifications"
                description="Receive notifications on your device"
                checked={settings.notifications.pushNotifications}
                onChange={(value) => updateSetting("notifications", "pushNotifications", value)}
              />
              <SettingToggle
                label="Service Alerts"
                description="Get notified about service disruptions"
                checked={settings.notifications.serviceAlerts}
                onChange={(value) => updateSetting("notifications", "serviceAlerts", value)}
              />
              <SettingToggle
                label="Arrival Reminders"
                description="Reminders before your bus arrives"
                checked={settings.notifications.arrivalReminders}
                onChange={(value) => updateSetting("notifications", "arrivalReminders", value)}
              />
              <SettingToggle
                label="Weekly Digest"
                description="Summary of your transit usage"
                checked={settings.notifications.weeklyDigest}
                onChange={(value) => updateSetting("notifications", "weeklyDigest", value)}
              />
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
            </div>

            <div className="space-y-1">
              <SettingSelect
                label="Language"
                value={settings.preferences.language}
                options={[
                  { value: "en", label: "English" },
                  { value: "am", label: "አማርኛ (Amharic)" },
                  { value: "or", label: "Afaan Oromoo" },
                  { value: "ti", label: "ትግርኛ (Tigrinya)" },
                ]}
                onChange={(value) => updateSetting("preferences", "language", value)}
              />
              <SettingSelect
                label="Units"
                value={settings.preferences.units}
                options={[
                  { value: "metric", label: "Metric (km)" },
                  { value: "imperial", label: "Imperial (mi)" },
                ]}
                onChange={(value) => updateSetting("preferences", "units", value)}
              />
              <SettingSelect
                label="Walking Speed"
                description="Used for trip planning calculations"
                value={settings.preferences.walkingSpeed}
                options={[
                  { value: "slow", label: "Slow (3 km/h)" },
                  { value: "normal", label: "Normal (5 km/h)" },
                  { value: "fast", label: "Fast (6 km/h)" },
                ]}
                onChange={(value) => updateSetting("preferences", "walkingSpeed", value)}
              />
              <SettingToggle
                label="Accessibility Mode"
                description="Prioritize accessible routes and stops"
                checked={settings.preferences.accessibilityMode}
                onChange={(value) => updateSetting("preferences", "accessibilityMode", value)}
              />
              <SettingToggle
                label="Show Crowding Info"
                description="Display real-time crowding levels"
                checked={settings.preferences.showCrowding}
                onChange={(value) => updateSetting("preferences", "showCrowding", value)}
              />
              <SettingToggle
                label="Auto Refresh"
                description="Automatically update arrival times"
                checked={settings.preferences.autoRefresh}
                onChange={(value) => updateSetting("preferences", "autoRefresh", value)}
              />
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Data</h3>
            </div>

            <div className="space-y-1">
              <SettingToggle
                label="Location Tracking"
                description="Allow app to access your location"
                checked={settings.privacy.locationTracking}
                onChange={(value) => updateSetting("privacy", "locationTracking", value)}
              />
              <SettingToggle
                label="Analytics Sharing"
                description="Help improve the app with usage data"
                checked={settings.privacy.analyticsSharing}
                onChange={(value) => updateSetting("privacy", "analyticsSharing", value)}
              />
              <SettingToggle
                label="Crash Reporting"
                description="Automatically send crash reports"
                checked={settings.privacy.crashReporting}
                onChange={(value) => updateSetting("privacy", "crashReporting", value)}
              />
            </div>
          </motion.div>

          {/* Offline & Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Wifi className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Offline & Data Usage</h3>
            </div>

            <div className="space-y-1">
              <SettingToggle
                label="Download Maps"
                description="Save maps for offline use (500MB)"
                checked={settings.offline.downloadMaps}
                onChange={(value) => updateSetting("offline", "downloadMaps", value)}
              />
              <SettingToggle
                label="Offline Schedules"
                description="Cache schedules for offline viewing"
                checked={settings.offline.offlineSchedules}
                onChange={(value) => updateSetting("offline", "offlineSchedules", value)}
              />
              <SettingSelect
                label="Data Usage"
                description="Control when to use mobile data"
                value={settings.offline.dataUsage}
                options={[
                  { value: "always", label: "Always" },
                  { value: "wifi-only", label: "Wi-Fi Only" },
                  { value: "never", label: "Never" },
                ]}
                onChange={(value) => updateSetting("offline", "dataUsage", value)}
              />
            </div>
          </motion.div>

          {/* App Info & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="space-y-1">
              <SettingButton
                label="Help & Support"
                description="Get help and contact support"
                icon={HelpCircle}
                onClick={() => console.log("Open help")}
              />
              <SettingButton
                label="About Transit"
                description="App version and legal information"
                icon={Info}
                onClick={() => console.log("Open about")}
                rightText="v6.0.1"
              />
              <SettingButton
                label="Sign Out"
                description="Sign out of your account"
                icon={LogOut}
                onClick={() => console.log("Sign out")}
                danger
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
