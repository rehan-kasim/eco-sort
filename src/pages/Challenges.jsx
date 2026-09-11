import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Leaf, Trophy, Users } from 'lucide-react'
import { BatteryCharging, Recycle, Sprout, Flag } from 'lucide-react'
import { CHALLENGES } from '../data/gamification.js'
import { binById } from '../data/bins.js'
import { applyServerProfile, loadState, LOCAL_PROFILE_PREFIX, saveState } from '../lib/store.js'
import { challengeAction, fetchChallenges } from '../lib/dataTier.js'
import { Tilt } from '../components/fx.jsx'
import { binCounts, haveSince, STEP_BINS } from '../lib/stepBins.js'
import { useEcoSync } from '../lib/useEcoSync.js'
import { SectionHead } from '../components/ui.jsx'

const iconMap = { leaf: Leaf, recycle: Recycle, battery: BatteryCharging, sprout: Sprout, trophy: Trophy, park: Flag }
const isLocal = (id) => !id || String(id).startsWith(LOCAL_PROFILE_PREFIX)
const SYNC_TTL_MS = 15_000

export default function Challenges() {
  const [state, setState] = useState(() => loadState())
  const [list, setList] = useState(CHALLENGES)
  const [justEarned, setJustEarned] = useState(null)
  const [stepNote, setStepNote] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const syncedRef = useRef(false)
  const lastSync = useRef(0)

  // Merge server progress WITHOUT clobbering local activity — and persist
  // only when something actually changed (otherwise the save event would
  // re-trigger this sync forever).
  const mergeServer = (r) => {
    if (!r.ok) return
    lastSync.current = Date.now()
    setList(r.challenges || CHALLENGES)
    // Server-side completions are authoritative (e.g. finished on another
    // device): snap those challenges straight to their target.
    const targets = {}
    for (const c of r.challenges || CHALLENGES) targets[c.id] = c.target
    setState((s) => {
      const progress = { ...s.challengeProgress }
      let changed = false
      for (const [k, v] of Object.entries(r.progress || {})) {
        const m = Math.max(progress[k] || 0, v)
        if (m !== progress[k]) {
          progress[k] = m
          changed = true
        }
      }
      for (const id of r.completed || []) {
        if (targets[id] !== undefined && (progress[id] || 0) < targets[id]) {
          progress[id] = targets[id]
          changed = true
        }
      }
      const joined = [...new Set([...s.joined, ...(r.joined || [])])]
      if (joined.length !== s.joined.length) changed = true
      if (!changed) return s
      const next = { ...s, joined, challengeProgress: progress }
      saveState(next)
      return next
    })
  }

  const syncFromServer = () => {
    const pid = loadState().profileId
    if (isLocal(pid)) return
    // Throttled: our own persists fire saveState events too — without this,
    // every join/step would trigger an extra GET (the changed-guard stops
    // loops, but not the wasted request). The window starts on success
    // (see mergeServer) so failures don't black out syncing.
    const now = Date.now()
    if (now - lastSync.current < SYNC_TTL_MS) return
    fetchChallenges(pid).then((r) => mergeServer(r))
  }

  // Initial pull once per profile + refresh on external mutations.
  useEffect(() => {
    if (syncedRef.current || isLocal(state.profileId)) return
    syncedRef.current = true
    syncFromServer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.profileId])
  useEcoSync(() => syncFromServer())

  const persist = (next) => {
    saveState(next)
    setState(next)
  }

  const join = async (id) => {
    if (state.joined.includes(id) || pendingId) return
    setStepNote(null)
    setPendingId(id)
    try {
      if (!isLocal(state.profileId)) {
        const r = await challengeAction({ profileId: state.profileId, action: 'join', id })
        if (r.ok) {
          // Single atomic persist: server profile wins, join layered on top.
          const synced = r.profile ? applyServerProfile(state, r.profile, state.history) : state
          persist({
            ...synced,
            joined: [...synced.joined, id],
            challengeProgress: { ...synced.challengeProgress, [id]: r.progress ?? 0 },
            challengeBaselines: { ...(synced.challengeBaselines || {}), [id]: r.baseline || binCounts(synced.history) },
          })
          // Optimistic count: the live tally refreshes on a 15s throttle.
          setList((prev) => prev.map((c) => (c.id === id ? { ...c, joined: (c.joined || 0) + 1 } : c)))
          return
        }
        // Server refused (validation, rate limit) — don't pretend locally.
        if (!r.offline) {
          setStepNote(r.error || 'Could not join the challenge. Try again.')
          return
        }
      }
      // Offline join: snapshot local counts — same post-join proof rule as server.
      persist({
        ...state,
        joined: [...state.joined, id],
        challengeProgress: { ...state.challengeProgress, [id]: 0 },
        challengeBaselines: { ...(state.challengeBaselines || {}), [id]: binCounts(state.history) },
      })
    } finally {
      setPendingId(null)
    }
  }

  const proofError = (c, have, need) => {
    const bins = STEP_BINS[c.id]
    return `Log a verified ${bins ? bins.map((b) => binById(b).label.toLowerCase()).join(' / ') : 'waste'} disposal first (${have}/${need}).`
  }

  const logStep = async (c) => {
    const cur = state.challengeProgress[c.id] || 0
    if (cur >= c.target || pendingId) return
    setStepNote(null)
    setPendingId(c.id)
    try {
      if (!isLocal(state.profileId)) {
        const r = await challengeAction({ profileId: state.profileId, action: 'step', id: c.id })
        if (r.ok) {
          const base = r.profile ? applyServerProfile(state, r.profile, state.history) : state
          persist({
            ...base,
            challengeProgress: { ...base.challengeProgress, [c.id]: r.progress },
            challengeBaselines: { ...(base.challengeBaselines || {}), [c.id]: r.baseline || base.challengeBaselines?.[c.id] || binCounts(base.history) },
          })
          if (r.completed) setJustEarned({ id: c.id, bonus: r.bonus })
          return
        }
        // Server refused (e.g. needs a verified disposal first) — say so plainly.
        if (!r.offline) {
          setStepNote(r.error || 'Could not log progress. Try again.')
          return
        }
      }
      // Offline step: SAME post-join proof rule as the server.
      const have = haveSince(binCounts(state.history), (state.challengeBaselines || {})[c.id] || {}, STEP_BINS[c.id])
      const need = cur + 1
      if (have < need) {
        setStepNote(proofError(c, have, need))
        return
      }
      const next = cur + 1
      let points = state.points
      if (next >= c.target) {
        points += c.points
        setJustEarned({ id: c.id, bonus: c.points })
      }
      persist({ ...state, challengeProgress: { ...state.challengeProgress, [c.id]: next }, points })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHead level={1} kicker="Play" title="Challenges" sub="Join. Verify. Win bonus." />
      {justEarned && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <Trophy size={17} /> Challenge complete! +{justEarned.bonus} bonus points added to your profile.
        </p>
      )}
      {stepNote && (
        <p role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {stepNote}
        </p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((c, i) => {
          const Icon = iconMap[c.icon] || Trophy
          const joined = state.joined.includes(c.id)
          const prog = state.challengeProgress[c.id] || 0
          const pct = Math.min(100, Math.round((prog / c.target) * 100))
          const done = prog >= c.target
          return (
            <Tilt key={c.id} max={7} className={`rise rise-${(i % 3) + 1}`}>
            <article className="card-hover flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#059669]/10 text-[#059669]"><Icon size={19} /></span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">+{c.points} pts</span>
              </div>
              <h3 className="font-display mt-3 font-bold">{c.title}</h3>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted-fg)]">{c.school}</p>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-[var(--color-muted-fg)]">{c.desc}</p>
              <p className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-[var(--color-muted-fg)]">
                <span className="flex items-center gap-1"><Users size={12} /> {c.joined.toLocaleString()}</span>
                <span className="flex items-center gap-1"><CalendarDays size={12} /> {c.endsIn}</span>
              </p>
              {joined ? (
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-bold"><span>{prog}/{c.target} {c.unit}</span><span>{done ? 'Completed!' : `${pct}%`}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--color-muted)]" role="progressbar" aria-label={`${c.title}: ${prog} of ${c.target} ${c.unit}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#059669] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <button disabled={done || !!pendingId} aria-busy={pendingId === c.id} onClick={() => logStep(c)}
                    className="focus-ring mt-2.5 min-h-[44px] w-full rounded-xl bg-[#1E3A5F] px-3 py-3 text-[13px] font-bold text-white disabled:opacity-50 hover:opacity-95">
                    {done ? 'Reward claimed ✓' : pendingId === c.id ? 'Logging…' : 'Claim step (+1)'}
                  </button>
                  {!done && (
                    <p className="mt-1.5 text-center text-[11px] font-medium text-[var(--color-muted-fg)]">
                      Needs a verified disposal — <Link to="/verify" className="font-bold text-[#059669] hover:underline">verify</Link>
                    </p>
                  )}
                </div>
              ) : (
                <button disabled={!!pendingId} aria-busy={pendingId === c.id} onClick={() => join(c.id)} className="focus-ring mt-3 min-h-[44px] w-full rounded-xl border-2 border-[#059669] px-3 py-3 text-[13px] font-bold text-[#059669] disabled:opacity-50 hover:bg-[#059669] hover:text-white">
                  {pendingId === c.id ? 'Joining…' : 'Join'}
                </button>
              )}
            </article>
            </Tilt>
          )
        })}
      </div>
    </div>
  )
}
