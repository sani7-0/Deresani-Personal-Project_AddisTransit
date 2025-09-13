import { useEffect, useMemo, useState } from "react"
import { submitFeedback } from "../lib/api"
import TopBar from "../components/TopBar"
import { Send, MessageSquare, Map, Hash, CarFront } from "lucide-react"

export default function FeedbackPage() {
  const [ipAddress, setIpAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [form, setForm] = useState({ route: "", busNumber: "", plateNumber: "", feedback: "" })
  // Citizen version: do not show or fetch global feedback entries

  useEffect(() => {
    let cancelled = false
    const fetchIp = async () => {
      try {
        // Try ipify first
        const res = await fetch("https://api.ipify.org?format=json")
        const data = await res.json()
        if (!cancelled) setIpAddress(data?.ip || "")
      } catch (_e) {
        try {
          // Fallback
          const res2 = await fetch("https://ipapi.co/json/")
          const data2 = await res2.json()
          if (!cancelled) setIpAddress(data2?.ip || "")
        } catch (_e2) {
          if (!cancelled) setIpAddress("")
        }
      }
    }
    fetchIp()
    return () => {
      cancelled = true
    }
  }, [])

  const isValid = useMemo(() => {
    return (
      form.route.trim().length > 0 &&
      form.busNumber.trim().length > 0 &&
      form.plateNumber.trim().length > 0 &&
      form.feedback.trim().length > 3
    )
  }, [form])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    setSuccessMsg("")
    try {
      await submitFeedback({
        route: form.route,
        busNumber: form.busNumber,
        plateNumber: form.plateNumber,
        feedback: form.feedback,
        ip: ipAddress,
        userAgent: navigator.userAgent,
        locale: navigator.language
      })
      setForm({ route: "", busNumber: "", plateNumber: "", feedback: "" })
      setSuccessMsg("Feedback submitted. Thank you!")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>

      <TopBar containerClassName="border-0 bg-transparent" />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
            <MessageSquare className="h-3.5 w-3.5" /> Feedback
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 mb-2">Share your bus experience</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl">
            Help improve public transit in Addis Ababa. Tell us about your ride by filling in the details below.
          </p>
        </div>

        {/* Form */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-6 shadow-xl">
              <div className="grid md:grid-cols-2 gap-4">
                <LabeledInput
                  label="Route"
                  placeholder="e.g. Arat Kilo - Bole"
                  icon={<Map className="h-4 w-4" />}
                  value={form.route}
                  onChange={(v) => setForm((s) => ({ ...s, route: v }))}
                />
                <LabeledInput
                  label="Bus Number"
                  placeholder="e.g. 12"
                  icon={<Hash className="h-4 w-4" />}
                  value={form.busNumber}
                  onChange={(v) => setForm((s) => ({ ...s, busNumber: v }))}
                />
                <LabeledInput
                  label="Plate Number"
                  placeholder="e.g. A12345"
                  icon={<CarFront className="h-4 w-4" />}
                  value={form.plateNumber}
                  onChange={(v) => setForm((s) => ({ ...s, plateNumber: v }))}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Your Feedback</label>
                  <div className="relative">
                    <textarea
                      rows={6}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Describe your experience..."
                      value={form.feedback}
                      onChange={(e) => setForm((s) => ({ ...s, feedback: e.target.value }))}
                      required
                    />
                    <MessageSquare className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 font-semibold shadow"
                >
                  <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
                {successMsg && <span className="text-sm text-emerald-700 dark:text-emerald-400">{successMsg}</span>}
              </div>
            </form>
          </div>
        </div>

        {/* Citizen version: feedback log intentionally hidden */}
      </div>

      <footer className="py-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} AddisTransit
      </footer>
    </div>
  )
}

function LabeledInput({ label, placeholder, icon, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-500/50"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <span className="absolute right-3 top-2.5 text-gray-400">{icon}</span>
      </div>
    </div>
  )
}

function Th({ children }) {
  return <th className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{children}</th>
}
function Td({ children }) {
  return <td className="p-3 text-gray-800 dark:text-gray-200">{children}</td>
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch (_) {
    return iso
  }
}


