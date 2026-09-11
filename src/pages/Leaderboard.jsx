import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Flame, GraduationCap, Loader2, ScanLine, TrendingUp, User } from 'lucide-react'
import { loadState } from '../lib/store.js'
import { fetchLeaderboard } from '../lib/dataTier.js'
import { useEcoSync } from '../lib/useEcoSync.js'
import { SectionHead } from '../components/ui.jsx'

const FETCH_TTL_MS = 30_000

export default function Leaderboard() {
  const [tab, setTab] = useState('schools')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(() => loadState())
  const firstLoad = useRef(true)
  const lastFetch = useRef(0)
  const fetching = useRef(null)

  const load = (force = false) => {
    const meNow = loadState()
    setMe(meNow)
    const now = Date.now()
    // Throttle: ranks change on verified disposals, not keystrokes — at most
    // one fetch per 30s, concurrent callers share the in-flight request.
    // The window starts on SUCCESS: failures retry on a short 5s window so an
    // offline/error response never poisons the cache for 30s.
    if (!force && !firstLoad.current && now - lastFetch.current < FETCH_TTL_MS) return
    if (fetching.current) return
    if (firstLoad.current) setLoading(true)
    fetching.current = fetchLeaderboard(meNow.profileId)
      .then((r) => {
        // A 429 is NOT "empty" — say so plainly instead of showing zero-state.
        setData(r.ok ? r : { ok: false, schools: [], students: [], empty: false, offline: !!r.offline, rateLimited: r.http === 429 })
        setLoading(false)
        firstLoad.current = false
        lastFetch.current = r.ok ? Date.now() : Date.now() - FETCH_TTL_MS + 5000
      })
      .finally(() => {
        fetching.current = null
      })
  }

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fresh ranks + identity after disposals elsewhere or in another tab.
  useEcoSync(() => load())

  const rows = tab === 'schools' ? data?.schools || [] : data?.students || []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionHead level={1} kicker="Ranks" title="Who sorts best?"
        sub="Per-student average × accuracy. Live from verified disposals." />
      <div className="mt-5 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1" role="group" aria-label="Leaderboard type">
        {[['schools', 'Schools'], ['students', 'Students']].map(([k, l]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}
            className={`focus-ring rounded-lg px-5 py-2 text-sm font-bold ${tab === k ? 'bg-[#1E3A5F] text-white' : 'text-[var(--color-muted-fg)]'}`}>{l}</button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/60 px-5 py-3 text-[13px] font-bold text-[var(--color-muted-fg)]">
          <Crown size={15} className="text-amber-500" />
          {me.profile.name
            ? <>Live standings · you are <span className="text-[#059669]">{me.profile.name} · {Number(me.points ?? 0).toLocaleString()} pts</span></>
            : <>Live standings</>}
          {data?.offline && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800 dark:bg-amber-950 dark:text-amber-200">You're offline — showing saved ranks</span>}
        </div>
        {data && !data.offline && (data.totals?.disposals > 0) && (
          <p className="border-b border-[var(--color-border)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-muted-fg)]">
            Community total: <b className="text-[var(--color-foreground)]">{Number(data.totals.disposals).toLocaleString()} verified disposals</b> · <b className="text-[var(--color-foreground)]">{data.totals.co2} kg CO₂e</b> avoided
          </p>
        )}

        {loading ? (
          <p className="flex items-center justify-center gap-2 px-5 py-12 text-sm font-semibold text-[var(--color-muted-fg)]">
            <Loader2 size={17} className="animate-spin" /> Loading live ranks…
          </p>
        ) : (data?.empty || rows.length === 0) ? (
          <div className="grid place-items-center px-5 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#059669]/10 text-[#059669]"><ScanLine size={22} /></span>
            <p className="font-display mt-3 font-bold">No ranks yet — the board is real and starts empty</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-fg)]">
              {data?.rateLimited
                ? 'Too many requests right now — wait a moment, then come back for live ranks.'
                : data?.offline
                  ? 'The backend is unreachable, so live ranks cannot load. Log disposals and they will appear once it is back.'
                  : 'Be the first to log a verified disposal and claim the #1 spot for your school.'}
            </p>
            <Link to="/scan" className="focus-ring mt-4 rounded-xl bg-[#059669] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#047857]">Scan your first item</Link>
          </div>
        ) : (
          <ol>
            {rows.map((r) => {
              // Identity: schools match by full name (public); students by the
              // server flag (board names are pseudonymized, unmatchable).
              const isMe = tab === 'schools'
                ? !!(me.profile.school && r.name === me.profile.school)
                : r.you === true
              return (
              <li key={`${tab}-${r.rank}-${r.name}-${r.school || ''}-${r.points ?? 0}`} className={`flex items-center gap-2 px-3 py-3.5 sm:gap-4 sm:px-5 ${r.rank !== rows.length ? 'border-b border-[var(--color-border)]' : ''} ${isMe ? 'bg-emerald-50/70 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950/30 dark:ring-emerald-800' : r.rank <= 3 ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}`}>
                <span className={`font-display grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${r.rank === 1 ? 'bg-amber-400 text-amber-950' : r.rank === 2 ? 'bg-slate-300 text-slate-800' : r.rank === 3 ? 'bg-amber-700 text-white' : 'bg-[var(--color-muted)] text-[var(--color-muted-fg)]'}`}>
                  {r.rank}
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1E3A5F] text-white">
                  {tab === 'schools' ? <GraduationCap size={18} /> : <User size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 truncate text-sm font-bold">{r.name || 'Unknown'}
                    {isMe && <span className="shrink-0 rounded-full bg-[#059669] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">you</span>}
                  </span>
                  <span className="block text-xs text-[var(--color-muted-fg)]">
                    {tab === 'schools'
                      ? `${Number(r.students ?? 0)} student${Number(r.students ?? 0) === 1 ? '' : 's'} · avg ${Number(r.avg ?? 0)} pts · ${Number(r.accuracy ?? 0)}% accuracy${(r.sites || []).length ? ` · codes: ${r.sites.join(', ')}` : ''}`
                      : `${r.school || ''} · ${Number(r.streak ?? 0)}-day streak`}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-display block text-[15px] font-bold">{Number(r.points ?? 0).toLocaleString()} pts</span>
                  {r.trend && <span className={`flex items-center justify-end gap-1 text-[11px] font-bold ${String(r.trend).startsWith('-') ? 'text-red-500' : 'text-emerald-600'}`}><TrendingUp size={12} />{r.trend}</span>}
                  {tab !== 'schools' && <span className="flex items-center justify-end gap-1 text-[11px] font-bold text-orange-500"><Flame size={12} />{Number(r.streak ?? 0)}</span>}
                </span>
              </li>
              )
            })}
          </ol>
        )}
      </div>
      <p className="mt-3 text-xs text-[var(--color-muted-fg)]">Points come from QR-verified disposals; wrong-bin scans earn only consolation points and don't move accuracy.</p>
    </div>
  )
}
