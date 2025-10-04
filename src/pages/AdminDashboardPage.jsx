import { useEffect, useMemo, useState } from "react"
import { fetchFeedbacks } from "../lib/api"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar"
import FleetManagement from "../components/FleetManagement"
import { LogOut, Bus } from "lucide-react"

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('feedbacks') // 'feedbacks' | 'fleet'
  const [feedbacks, setFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)
  // removed AI forecasts state

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

  // Removed AI forecasts tab and data load per request

  // removed AI KPI calculations

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
            {/* AI tab removed */}

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


