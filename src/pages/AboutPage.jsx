import TopBar from "../components/TopBar"

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>

      <TopBar containerClassName="border-0 bg-transparent" />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">About AddisTransit</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-8">A practical, lightweight transit companion for Addis Ababa that helps riders reduce uncertainty, plan smarter trips, and stay informed in real time.</p>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow">
            <h2 className="text-xl font-semibold mb-2">The Challenge</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Riders in Addis Ababa struggle with uncertain wait times, unclear routes, and scarce service alerts. Traditional schedules rarely
              reflect real conditions, and information is fragmented across sources.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              Operators also need better tools to anticipate demand, allocate vehicles, and communicate disruptions quickly—especially under
              variable traffic and network conditions.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow">
            <h2 className="text-xl font-semibold mb-2">Our Solution</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Real-time style bus tracking and a clean map experience</li>
              <li>Trip planning with suggested departure windows</li>
              <li>Live service alerts for delays, diversions, and closures</li>
              <li>Offline-ready PWA for low connectivity conditions</li>
              <li>AI-assisted demand forecasts to reduce crowding</li>
            </ul>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="font-semibold mb-1">Who it’s for</div>
                <div className="text-gray-700 dark:text-gray-300 text-sm">Daily riders, visitors, and operators who need fast, reliable guidance without heavy data usage.</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="font-semibold mb-1">Design principles</div>
                <div className="text-gray-700 dark:text-gray-300 text-sm">Fast, clear, mobile-first, and resilient to patchy networks with graceful fallbacks.</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow">
            <h2 className="text-xl font-semibold mb-2">How the AI Forecasts Help</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The system aggregates historical patterns (by date, route, and time slot) to estimate likely passenger demand. We present ranges
              (lower–upper bounds) to reflect uncertainty and avoid overconfidence. Forecasts inform riders when to depart and help operators
              decide where extra capacity is useful.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              These forecasts are indicative, not guarantees. As live data becomes available, predictions are recalibrated to improve accuracy.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow">
            <h2 className="text-xl font-semibold mb-2">Data, Privacy, and Reliability</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>We minimize data collection and only store feedback that users explicitly submit.</li>
              <li>All metrics are aggregated; no personal identities are displayed.</li>
              <li>Where live feeds are unavailable, simulated data and forecasts are clearly labeled.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow">
            <h2 className="text-xl font-semibold mb-2">What’s Next</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We’re working on integrating live feeds, richer route coverage, and more accurate AI forecasts, while keeping the app lightweight and
              accessible on all devices.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 mt-3">
              <li>Real-time GTFS and AVL integrations</li>
              <li>Operator dashboards for load balancing and incident response</li>
              <li>Multimodal options (walking transfers and future rail integrations)</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-5 shadow">
            <h2 className="text-xl font-semibold mb-2">Get Involved</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Share feedback, contribute route data, or help with translations. Your input directly improves transit for everyone in Addis Ababa.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


