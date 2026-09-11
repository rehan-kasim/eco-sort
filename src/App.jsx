import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Leaf, Loader2 } from 'lucide-react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyServerProfile, freshState, loadState, LOCAL_PROFILE_PREFIX, rid, saveState } from './lib/store.js'
import { createProfile, fetchProfile } from './lib/dataTier.js'
import { useEcoSync } from './lib/useEcoSync.js'

const Landing = lazy(() => import('./pages/Landing.jsx'))
const Scanner = lazy(() => import('./pages/Scanner.jsx'))
const Guide = lazy(() => import('./pages/Guide.jsx'))
const Verify = lazy(() => import('./pages/Verify.jsx'))
const Challenges = lazy(() => import('./pages/Challenges.jsx'))
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))

function Fallback() {
  return <div className="mx-auto max-w-7xl px-6 py-16 text-center text-sm font-semibold text-[var(--color-muted-fg)]">Loading EcoSort…</div>
}

const TITLES = {
  '/': 'EcoSort AI — Smart Waste, Smarter Future',
  '/scan': 'AI Scanner · EcoSort AI',
  '/guide': 'Bin Guide · EcoSort AI',
  '/verify': 'QR Verification · EcoSort AI',
  '/challenges': 'Challenges · EcoSort AI',
  '/leaderboard': 'Leaderboards · EcoSort AI',
  '/dashboard': 'Impact Dashboard · EcoSort AI',
}

function RouteTitles() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = TITLES[pathname] || 'Page not found · EcoSort AI'
    // SPA route change: reset scroll without smooth drift (works everywhere —
    // temporarily overrides the CSS smooth behavior), then move
    // keyboard/screen-reader focus to the page heading.
    const root = document.documentElement
    const prev = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = prev
    const h = document.querySelector('main h1')
    if (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1')
      h.focus({ preventScroll: true })
    }
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center px-4 py-20 text-center">
      <p className="font-display text-6xl font-extrabold text-[#1E3A5F] dark:text-white">404</p>
      <h1 className="font-display mt-2 text-xl font-bold">This page got recycled</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-fg)]">The page you looked for doesn't exist. Let's get you back to sorting.</p>
      <div className="mt-5 flex gap-2">
        <Link to="/" className="focus-ring rounded-xl bg-[#059669] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#047857]">Home</Link>
        <Link to="/scan" className="focus-ring rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-muted)]">Scan waste</Link>
      </div>
    </div>
  )
}

function Onboarding({ onDone }) {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [klass, setKlass] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const inFlight = useRef(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !school.trim() || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try {
      const base = { ...freshState(), onboarded: true, profile: { name: name.trim(), school: school.trim(), klass: klass.trim() } }
      // Try the real backend first; fall back to a local-only profile offline.
      const res = await createProfile({ name: name.trim(), school: school.trim(), klass: klass.trim() })
      if (res.ok && res.profile) {
        saveState(applyServerProfile(base, res.profile, []))
      } else if (res.offline) {
        // Persist the warning on the profile so it survives onboarding and
        // stays visible in the app until dismissed — not flashed and lost.
        saveState({ ...base, profileId: `${LOCAL_PROFILE_PREFIX}${rid().slice(0, 12)}`, notice: 'Backend unreachable — you are on an on-device profile. Points and ranks will sync once the backend is reachable.' })
      } else {
        setNote(res.error || 'Could not create profile. Try again.')
        return
      }
      onDone()
      nav('/scan')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[80vh] w-full max-w-md place-items-center px-4 py-10">
      <form onSubmit={submit} className="rise w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-xl">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1E3A5F] text-white"><Leaf size={24} /></span>
        <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight">Who's sorting?</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">One profile. Points, ranks, streaks.</p>
        <label className="mt-5 block text-sm font-bold">Name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoComplete="name"
            aria-describedby={note ? 'name-help onboard-error' : 'name-help'} aria-invalid={note ? true : undefined}
            className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm outline-none" />
          <span id="name-help" className="mt-1 block text-xs font-medium text-[var(--color-muted-fg)]">Shown on ranks.</span>
        </label>
        <label className="mt-3 block text-sm font-bold">School
          <input value={school} onChange={(e) => setSchool(e.target.value)} required maxLength={60}
            aria-describedby={note ? 'school-help onboard-error' : 'school-help'} aria-invalid={note ? true : undefined}
            className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm outline-none" />
          <span id="school-help" className="mt-1 block text-xs font-medium text-[var(--color-muted-fg)]">Ranks group by school.</span>
        </label>
        <label className="mt-3 block text-sm font-bold">Class <span className="font-medium text-[var(--color-muted-fg)]">(optional)</span>
          <input value={klass} onChange={(e) => setKlass(e.target.value)} maxLength={20}
            className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm outline-none" />
        </label>
        {note && <p role="alert" id="onboard-error" className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">{note}</p>}
        <button disabled={busy || !name.trim() || !school.trim()}
          className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#059669] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#047857]">
          {busy && <Loader2 size={16} className="animate-spin" />} Start
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(() => {
    try {
      return !!loadState().onboarded
    } catch {
      return false
    }
  })

  const [notice, setNotice] = useState(() => {
    try {
      return loadState().notice || ''
    } catch {
      return ''
    }
  })

  // Re-read after onboarding (the notice is written during submit) + track
  // cross-tab changes.
  const reloadNotice = () => {
    try {
      setNotice(loadState().notice || '')
    } catch { /* ignore */ }
  }
  useEcoSync(() => reloadNotice())

  const dismissNotice = () => {
    setNotice('')
    try {
      const s = loadState()
      delete s.notice
      saveState(s)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    try {
      const t = localStorage.getItem('ecosort:theme')
      if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark')
    } catch {}
    // Rehydrate server truth on startup (new device / cleared cache):
    // local extras (outbox, baselines, notice, lastScan) survive the merge.
    // Skipped while an outbox is pending — Verify's flush owns that sync and
    // a stale pre-flush snapshot must not overwrite its merge-back.
    try {
      const s = loadState()
      if (s.onboarded && s.profileId && !String(s.profileId).startsWith(LOCAL_PROFILE_PREFIX) && !(s.outbox || []).length) {
        fetchProfile(s.profileId).then((r) => {
          if (r.ok && r.profile) saveState(applyServerProfile(loadState(), r.profile, r.history || []))
        })
      }
    } catch { /* offline — local mirror stands */ }
  }, [])

  return (
    <BrowserRouter>
      <RouteTitles />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <InstallPrompt />
        {ready && notice && (
          <p role="status" className="mx-auto mt-3 flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 text-[13px] font-semibold sm:px-6 print:hidden">
            <span className="flex-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">{notice}</span>
            <button onClick={dismissNotice} className="focus-ring rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">Dismiss</button>
          </p>
        )}
        <main className="flex-1">
          {!ready ? (
            <Onboarding onDone={() => { reloadNotice(); setReady(true) }} />
          ) : (
            <ErrorBoundary key={ready ? 'app' : 'onboarding'}>
            <Suspense fallback={<Fallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/scan" element={<Scanner />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          )}
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
