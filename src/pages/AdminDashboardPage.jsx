import { useEffect, useMemo, useState } from "react"
import { fetchFeedbacks } from "../lib/api"
import forecastsUrl from "../../addis_bus_forecast_sep2025_timeslot_holidays.csv?url"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar"
import FleetManagement from "../components/FleetManagement"
import { BarChart2, Users, Map, AlertTriangle, LogOut, Bus } from "lucide-react"

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('ai') // 'ai' | 'feedbacks' | 'fleet'
  const [feedbacks, setFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)
  const [forecasts, setForecasts] = useState([])
  const [loadingForecasts, setLoadingForecasts] = useState(false)
  const [filter, setFilter] = useState({ from: '', to: '', slot: '', start: '', end: '' })

  useEffect(() => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) navigate("/admin/login")
    } catch (_) {}
  }, [navigate])

  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'feedbacks') return
      setLoadingFeedbacks(true)
      try {
        const data = await fetchFeedbacks(200)
        setFeedbacks(data)
      } catch (e) {
        setFeedbacks([])
      } finally {
        setLoadingFeedbacks(false)
      }
    }
    load()
  }, [activeTab])

  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'ai' || forecasts.length > 0) return
      setLoadingForecasts(true)
      try {
        const res = await fetch(forecastsUrl)
        const text = await res.text()
        const rows = text.trim().split(/\r?\n/)
        const header = rows.shift().split(',')
        const idx = (name) => header.indexOf(name)
        const out = []
        for (const line of rows) {
          const cols = line.split(',')
          out.push({
            date: cols[idx('date')],
            predicted_passengers: Number(cols[idx('predicted_passengers')]),
            lower_bound: Number(cols[idx('lower_bound')]),
            upper_bound: Number(cols[idx('upper_bound')]),
            origin: cols[idx('origin')],
            destination: cols[idx('destination')],
            time_slot: cols[idx('time_slot')],
          })
        }
        setForecasts(out)
      } finally {
        setLoadingForecasts(false)
      }
    }
    load()
  }, [activeTab, forecasts.length])

  const uniqueOrigins = useMemo(() => Array.from(new Set(forecasts.map(f => f.origin))).sort(), [forecasts])
  const uniqueDestinations = useMemo(() => Array.from(new Set(forecasts.map(f => f.destination))).sort(), [forecasts])
  const uniqueSlots = useMemo(() => Array.from(new Set(forecasts.map(f => f.time_slot))).sort(), [forecasts])

  const filteredForecasts = useMemo(() => {
    return forecasts.filter(f => {
      if (filter.from && f.origin !== filter.from) return false
      if (filter.to && f.destination !== filter.to) return false
      if (filter.slot && f.time_slot !== filter.slot) return false
      if (filter.start && f.date < filter.start) return false
      if (filter.end && f.date > filter.end) return false
      return true
    })
  }, [forecasts, filter])

  const kpiData = useMemo(() => {
    const rows = filteredForecasts.length ? filteredForecasts : forecasts
    if (!rows.length) return { total: 0, pairs: 0, avg: 0, peak: 0, today: 0 }
    let total = 0
    let peak = 0
    const pairsSet = new Set()
    const todayStr = new Date().toISOString().split('T')[0]
    let today = 0
    for (const r of rows) {
      const p = Number(r.predicted_passengers) || 0
      total += p
      if (p > peak) peak = p
      pairsSet.add(`${r.origin}→${r.destination}`)
      if (r.date === todayStr) today += p
    }
    const avg = Math.round(total / rows.length)
    return { total: Math.round(total), pairs: pairsSet.size, avg, peak: Math.round(peak), today: Math.round(today) }
  }, [filteredForecasts, forecasts])

  const logout = () => {
    localStorage.removeItem("admin_token")
    navigate("/admin/login")
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>

      <TopBar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Overview of city data and system activity</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold shadow">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Layout with Sidebar */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-3 h-fit -ml-4 md:-ml-6 lg:-ml-8">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 mb-2">Menu</div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${activeTab === 'ai' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                AI Statistics
              </button>
              <button
                onClick={() => setActiveTab('feedbacks')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${activeTab === 'feedbacks' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                User Feedbacks
              </button>
              <button
                onClick={() => setActiveTab('fleet')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${activeTab === 'fleet' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              >
                Fleet Management
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {activeTab === 'ai' && (
              <>
                {/* Section Title */}
                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl p-5 mb-6">
                  <div className="mb-0">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI -Driven Passenger Demand Prediction</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Forecasts and confidence intervals with flexible filters</p>
                  </div>
                </div>

                {/* Widgets from forecast data */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={<Users className="h-5 w-5" />} title="Todays Predicted Riders" value={kpiData.today.toLocaleString()} delta="" />
                  <StatCard icon={<Map className="h-5 w-5" />} title="Origin–Destination Pairs" value={kpiData.pairs.toLocaleString()} delta="" />
                  <StatCard icon={<BarChart2 className="h-5 w-5" />} title="Avg per Row" value={kpiData.avg.toLocaleString()} delta="" />
                  <StatCard icon={<AlertTriangle className="h-5 w-5" />} title="Peak Predicted" value={kpiData.peak.toLocaleString()} delta="" />
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl p-5">

                  {/* Filters */}
                  <div className="grid md:grid-cols-5 gap-3 mb-4">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Origin</label>
                      <select value={filter.from} onChange={(e)=>setFilter(s=>({...s, from:e.target.value}))} className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-2 py-2">
                        <option value="">All</option>
                        {uniqueOrigins.map(o=> <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Destination</label>
                      <select value={filter.to} onChange={(e)=>setFilter(s=>({...s, to:e.target.value}))} className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-2 py-2">
                        <option value="">All</option>
                        {uniqueDestinations.map(d=> <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Time Slot</label>
                      <select value={filter.slot} onChange={(e)=>setFilter(s=>({...s, slot:e.target.value}))} className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-2 py-2">
                        <option value="">All</option>
                        {uniqueSlots.map(s=> <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Start Date</label>
                      <input type="date" value={filter.start} onChange={(e)=>setFilter(s=>({...s, start:e.target.value}))} className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-2 py-2" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">End Date</label>
                      <input type="date" value={filter.end} onChange={(e)=>setFilter(s=>({...s, end:e.target.value}))} className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-2 py-2" />
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                          <Th>Date</Th>
                          <Th>Origin</Th>
                          <Th>Destination</Th>
                          <Th>Time Slot</Th>
                          <Th>Predicted</Th>
                          <Th>Lower</Th>
                          <Th>Upper</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingForecasts && (
                          <tr><Td colSpan={7}>Loading forecasts...</Td></tr>
                        )}
                        {!loadingForecasts && filteredForecasts.length === 0 && (
                          <tr><Td colSpan={7}>No rows match filters.</Td></tr>
                        )}
                        {!loadingForecasts && filteredForecasts.map((r, i) => (
                          <tr key={`${r.date}-${r.origin}-${r.destination}-${r.time_slot}-${i}`} className="border-t border-gray-100 dark:border-gray-800">
                            <Td>{r.date}</Td>
                            <Td>{r.origin}</Td>
                            <Td>{r.destination}</Td>
                            <Td>{r.time_slot}</Td>
                            <Td>{Math.round(r.predicted_passengers)}</Td>
                            <Td>{Math.round(r.lower_bound)}</Td>
                            <Td>{Math.round(r.upper_bound)}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'feedbacks' && (
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent User Feedbacks</h2>
                  <span className="text-sm text-gray-500">Latest</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                        <Th>Time</Th>
                        <Th>IP</Th>
                        <Th>Route</Th>
                        <Th>Bus No.</Th>
                        <Th>Plate</Th>
                        <Th>Feedback</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingFeedbacks && (
                        <tr><Td colSpan={6}>Loading...</Td></tr>
                      )}
                      {!loadingFeedbacks && feedbacks.length === 0 && (
                        <tr><Td colSpan={6}>No feedbacks found.</Td></tr>
                      )}
                      {!loadingFeedbacks && feedbacks.map((f) => (
                        <tr key={f.id} className="border-t border-gray-100 dark:border-gray-800 align-top">
                          <Td>{new Date(f.created_at).toLocaleString()}</Td>
                          <Td>{f.submitter_ip || ''}</Td>
                          <Td>{f.route}</Td>
                          <Td>{f.bus_number}</Td>
                          <Td>{f.plate_number}</Td>
                          <Td>
                            <div className="max-w-xl whitespace-pre-wrap leading-relaxed">{f.feedback}</div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'fleet' && (
              <FleetManagement />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, delta }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        </div>
        <div className="text-sm text-emerald-600 dark:text-emerald-400">{delta}</div>
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


