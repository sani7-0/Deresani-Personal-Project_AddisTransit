import { useState, useMemo } from "react"
import TopBar from "../components/TopBar"
import { Map, Route, Smartphone, Languages, HelpCircle, Users } from "lucide-react"

const translations = {
  en: {
    langName: "English",
    heroTitle: "AddisTransit – Real-time public transit for Addis Ababa",
    heroSubtitle:
      "A simple, fast, and multilingual app to find buses, plan trips, and navigate Addis Ababa with confidence.",
    ctaMap: "Open Map",
    ctaPlanner: "Plan a Trip",
    sectionAboutTitle: "What problem we solve",
    sectionAboutBody:
      "Finding reliable public transit information in Addis Ababa is hard. AddisTransit aggregates routes, stops, and simulated live bus positions to help riders discover nearby routes, check arrivals, and plan efficient trips — even on low connectivity devices.",
    featuresTitle: "Highlights",
    features: [
      "Real-time style bus updates",
      "Trip planning between popular landmarks",
      "Works great on mobile and offline-ready PWA",
      "Multilingual interface for local languages",
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        q: "Is the data real-time?",
        a: "The demo uses a realistic simulation. It can connect to live feeds when available.",
      },
      { q: "Does it work offline?", a: "Yes, it is a PWA and caches key assets." },
      {
        q: "Which areas are covered?",
        a: "Addis Ababa routes are included first; we plan to expand coverage.",
      },
      {
        q: "How can I contribute?",
        a: "Share feedback, routes, and stops data or help translate the interface.",
      },
    ],
    teamTitle: "Team",
    team: [
      { name: "Deresani Yetnayet", role: "Fullstack Developer" },
      { name: "Naol Kebede", role: "Fullstack Developer" },
      { name: "Achenef Tarekegn", role: "Marketing" },
      { name: "Demewez Demeke", role: "AI Modelist" },
      { name: "Mulu Berhan", role: "Sales Manager" },
    ],
  },
  am: {
    langName: "አማርኛ",
    heroTitle: "AddisTransit – የአዲስ አበባ የህዝብ ትራንዚት መረጃ",
    heroSubtitle:
      "አብራሪ ፈጣን እና ቀላል መተግበሪያ ለአዲስ አበባ ባስ መፈለግ፣ ጉዞ መከተት እና መቃኘት.",
    ctaMap: "ካርታ ክፈት",
    ctaPlanner: "ጉዞ አዘጋጅ",
    sectionAboutTitle: "የምንፈታው ችግኝ",
    sectionAboutBody:
      "በአዲስ አበባ የህዝብ ትራንዚት መረጃ ማግኘት አስቸጋሪ ነው። AddisTransit መንገዶችን፣ ማቆሚያዎችን እና እውነተኛን የመሳሰሉ ህይወት ባስ እንቅስቃሴ ይያዛል እና ተጓዦች መንገዶችን እንዲያገኙ እና ጊዜያትን እንዲመርምሩ ይረዳቸዋል.",
    featuresTitle: "ልዩ ባህሪዎች",
    features: [
      "የእውነተኛ ጊዜ እንደሚመስል የባስ ሁኔታ",
      "በታዋቂ መደበኛ ቦታዎች መካከል ጉዞ እቅድ",
      "በሞባይል ላይ ጥሩ እና PWA ድጋፍ",
      "በብዙ ቋንቋ የተዘጋጀ በቀላሉ ለመጠቀም",
    ],
    faqTitle: "ተደጋጋሚ ጥያቄዎች",
    faqs: [
      { q: "መረጃው በእውነተኛ ጊዜ ነው?", a: "አሁን ለማሳየት ልምድ ስርዓት እንጠቀማለን። እውነተኛ ምንጮች ሲኖሩ ሊገናኙ ይችላሉ።" },
      { q: "ከመስመር ውጭ ይሰራል?", a: "አዎን፣ PWA ነው እና ዋና ንብረቶችን ይከማቻል።" },
      { q: "የተሸፈነው አካባቢ?", a: "በመጀመሪያ አዲስ አበባ መንገዶች ናቸው፣ መስፋፋት እንደሚኖር እቅድ አለ።" },
      { q: "እንዴት ልረዳ?", a: "አስተያየት ያካፍሉ፣ መንገዶችን እና ማቆሚያዎችን ያካትቱ ወይም ትርጉም ይሁኑ።" },
    ],
    teamTitle: "ቡድን",
    team: [
      { name: "Deresani Yetnayet", role: "Fullstack Developer" },
      { name: "Naol Kebede", role: "Fullstack Developer" },
      { name: "Achenef Tarekegn", role: "Marketing" },
      { name: "Demewez Demeke", role: "AI Modelist" },
      { name: "Mulu Berhan", role: "Marketing" },
    ],
  },
  om: {
    langName: "Afaan Oromoo",
    heroTitle: "AddisTransit – Tajaajila ittiin imaltuu uummataa Addis Ababa",
    heroSubtitle:
      "App salphaa fi saffisaa, bitaa fi mirga imala kee qindeesu, bussiwwan argachuuf, akkasumas karaa keessa of qajeelchuuf.",
    ctaMap: "Kaartaa Bani",
    ctaPlanner: "Imala Qindeessi",
    sectionAboutTitle: "Rakkoo inni hiiku",
    sectionAboutBody:
      "Odeeffannoo imalaa uummataa argachuun garaagara. AddisTransit karaa, iddoo dhaabbataa fi odeeffannoo bussiwwan akkuma yeroo dhugaa fakkaatu walitti qaba; imaltoonni karaa naannoo argachuu fi imala gaarii qindeessu ni danda'u.",
    featuresTitle: "Amaloota",
    features: [
      "Odeeffannoo bussiwwan yeroo dhugaa fakkaatu",
      "Imala iddoo beekamoo gidduutti qindeessuu",
      "Mobile irratti wayyaa, akkasumas PWA tajaajila alaa",
      "Afaan hedduun fayyadama salphaa",
    ],
    faqTitle: "Gaaffilee yeroo baay'ee gaafataman",
    faqs: [
      { q: "Odeeffannoon yeroo dhugaati?", a: "Fakkeenya tajaajila tajaajilaa fayyadamna; yeroo jiraatuu waliin walitti ni hidhama." },
      { q: "Offline ni hojjetaa?", a: "Eeyyee, PWA dha; qabeenya ijoo ni kuufa." },
      { q: "Eessa qofa tajaajiluu?", a: "Addis Ababa jalqabaa; bal'inaan tajaajiluu ni karoorfanna." },
      { q: "Akkaataa gargaarsa?", a: "Yaada kennaa, odeeffannoo karaa fi dhaabbataa qoodaa yookaan hiika dabalataa godhaa." },
    ],
    teamTitle: "Hojii geggeessitoota",
    team: [
      { name: "Deresani Yetnayet", role: "Fullstack Developer" },
      { name: "Naol Kebede", role: "Fullstack Developer" },
      { name: "Achenef Tarekegn", role: "Marketing" },
      { name: "Demewez Demeke", role: "AI Modelist" },
      { name: "Mulu Berhan", role: "Marketing" },
    ],
  },
  ti: {
    langName: "ትግርኛ",
    heroTitle: "AddisTransit – ሕቡራት መጓዓዝ ንኣዲስ ኣበባ",
    heroSubtitle:
      "መተግበሪ ቀሊል እና ብጣዕሚ ብፍጥነት ንኣስራሕ መንገዲ ፍልስልሲ እና መብት ምዕጋዝ.",
    ctaMap: "ካርታ ክፈት",
    ctaPlanner: "መጓዓዝ ኣዘጋጅ",
    sectionAboutTitle: "ጸገም እንታይ ክፈትና እዩ",
    sectionAboutBody:
      "ናይ ሕቡራት መጓዓዝ መረጃ ብኣዲስ ኣበባ ምርካብ ኣስቸጋሪ እዩ። AddisTransit መንገዶችን፣ ማቆሚያዎችን እና ዝመስል እውነት ዝረኣየ ንቡስ እንቅስቃሴ ይኣክል እና ጓዕዞታት ናይ ኣብ ቀረባ መንገዶች ምርካብ እና ግዜ ምርመራ ይሕግዝ።",
    featuresTitle: "ምርጥ ባህሪታት",
    features: [
      "እውነት ዝመስል ናይ ግዜ ሕጂ ግብሪ ናይ ንቡስ",
      "መጓዓዝ ካብ ቦታታት ዝተፈላለዩ መካከል ምድላው",
      "ብመተግበሪ ሞባይል ዝሓለፈ እና PWA ድጋፍ",
      "ብቋንቋታት ብዙሓት ኣብ ምትግበር",
    ],
    faqTitle: "ብዝሒ ዝሓለፉ ሕቶታት",
    faqs: [
      { q: "መረጃ እውነት እዩ?", a: "ምርካብ ሞዴል ንምርካብ እንጠቕመር። እውነት ምንጪ ኣብ ምኻን ክትዕር ይኽእል።" },
      { q: "ካብ መስመር ውጽኣት ይሰርሕ?", a: "እወ፣ PWA እዩ እና ኣብ ዋና ንብረታት ይከማቻ።" },
      { q: "ናበይ ይሸፍን?", a: "ኣዲስ ኣበባ ብጀማምረ; ምስፋፋሕ ንምእካይ እትኽእል።" },
      { q: "ከመይ ክትሓግዙ?", a: "ምኽሪ ኣቕርቡ፣ መንገዶችን እና ማቆሚያዎችን ኣካፍሉ ወይ ትርጓሜ ሓግዙ።" },
    ],
    teamTitle: "ቡድን",
    team: [
      { name: "Deresani Yetnayet", role: "Fullstack Developer" },
      { name: "Naol Kebede", role: "Fullstack Developer" },
      { name: "Achenef Tarekegn", role: "Marketing" },
      { name: "Demewez Demeke", role: "AI Modelist" },
      { name: "Mulu Berhan", role: "Marketing" },
    ],
  },
}

export default function LandingPage() {
  const [lang, setLang] = useState("en")
  const t = useMemo(() => translations[lang], [lang])

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>

      <TopBar containerClassName="border-0 bg-transparent" />

      <div className="max-w-6xl mx-auto px-4">
        {/* Language Selector */}
        <div className="flex justify-end pt-6">
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-white/90 backdrop-blur dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm shadow-sm"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
            <option value="om">Afaan Oromoo</option>
            <option value="ti">ትግርኛ</option>
          </select>
        </div>

        {/* Hero */}
        <section className="py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
                <Map className="h-3.5 w-3.5" /> AddisTransit
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 mb-4">
                {t.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">{t.heroSubtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/map" className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium shadow">
                  {t.ctaMap}
                </a>
                <a href="/trip-planner" className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 hover:bg-white text-gray-900 dark:text-gray-100 font-medium shadow-sm">
                  {t.ctaPlanner}
                </a>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-green-500/20 to-emerald-500/20 blur-2xl" />
              <div className="relative rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-6 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <FeatureCard icon={<Route className="h-5 w-5" />} title="Routes">
                    Discover nearby bus routes and stops
                  </FeatureCard>
                  <FeatureCard icon={<Smartphone className="h-5 w-5" />} title="PWA">
                    Installable and works great on mobile
                  </FeatureCard>
                  <FeatureCard icon={<Languages className="h-5 w-5" />} title="Multilingual">
                    English, አማርኛ, Afaan Oromoo, ትግርኛ
                  </FeatureCard>
                  <FeatureCard icon={<HelpCircle className="h-5 w-5" />} title="FAQs">
                    Clear answers to common questions
                  </FeatureCard>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem / About */}
        <section className="py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="md:flex md:items-start md:gap-8">
            <div className="md:w-1/3 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">{t.sectionAboutTitle}</h2>
            </div>
            <div className="md:flex-1">
              <p className="text-gray-700 dark:text-gray-300 max-w-4xl leading-relaxed">
                {t.sectionAboutBody}
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-6">{t.featuresTitle}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {t.features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div className="text-gray-700 dark:text-gray-300">{f}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-6">{t.faqTitle}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {t.faqs.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white/70 dark:bg-gray-900/60 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">{item.q}</div>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="py-12 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-6">{t.teamTitle}</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {t.team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white/70 dark:bg-gray-900/60 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div className="text-base font-semibold flex items-center gap-2">
                      {member.name}
                      <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{member.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="py-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} AddisTransit
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="font-semibold mb-0.5">{title}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
        </div>
      </div>
    </div>
  )
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}


