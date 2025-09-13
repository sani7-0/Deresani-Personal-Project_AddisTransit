import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/TopBar"
import { adminLogin } from "../lib/api"
import { Lock, Mail, LogIn } from "lucide-react"

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    try {
      const token = localStorage.getItem("admin_token")
      if (token) navigate("/admin/dashboard")
    } catch (_) {}
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (!email.trim() || !password.trim()) {
        setError("Enter email and password")
        return
      }
      try {
        const data = await adminLogin(email, password)
        localStorage.setItem("admin_token", data.token)
        navigate("/admin/dashboard")
      } catch (e) {
        setError("Invalid credentials")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>

      <TopBar />

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-6 shadow-xl">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
              <Lock className="h-3.5 w-3.5" /> Admin
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Admin Login</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Restricted access. Authorized personnel only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <input
                  type="password"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/60 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 font-semibold shadow"
            >
              <LogIn className="h-4 w-4" /> {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


