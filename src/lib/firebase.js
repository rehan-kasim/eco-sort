// Firebase tier: Realtime Database (app data) + Analytics (usage events).
// Detection is Groq-only (via /api) — this tier is the STATE backend.
// All SDK imports are LAZY (dynamic import) so the bundle costs nothing when
// Firebase is unconfigured.
//
// When VITE_FIREBASE_* env is set, this tier is the SINGLE source of truth
// for state (profiles, disposals, challenges, ranks). When unset, dataTier.js
// routes to /api + localStorage instead — so the two backends never
// split-brain: exactly one cloud tier is active at a time.
//
// Data model (root `ecosort/v1`, pilot-scale: full-profile reads are fine
// into the low thousands of users; revisit with indexed queries past that):
//   profiles/{pid}      aggregate doc (pseudonym name ONLY — see below)
//   scans/{pid}/{sid}    AI scan records {bin,item,at:serverTimestamp,used}
//   challenges/{pid}/{cid} {progress, baseline, completed}
//   challengesIndex/{cid}/joins  live participant counts
//   schools/{schoolKey}/sites    seen bin codes (array)
//   counters/{disposals,co2,scans}
//
// Privacy: display names are pseudonymized at WRITE time (first + initial)
// because RTDB rules for a no-auth pilot allow reads. Full names never leave
// the device. Server-time (.info/serverTimeOffset) backs TTL checks so client
// clocks can't forge freshness.
import { BIN_IDS, binById } from '../data/bins.js'
import { CHALLENGES } from '../data/gamification.js'
import {
  CO2_ABSORBED_PER_TREE_YEAR_KG,
  DAILY_DISPOSAL_LIMIT,
  KG_PER_RECYCLABLE_ITEM,
  SCAN_MATCH_BONUS,
  SCAN_TTL_MS,
  scoreDisposal,
} from './scoring.js'
import { binCounts, haveSince, STEP_BINS } from './stepBins.js'
import { parseBinPayload, rid } from './store.js'
import { pseudonym, sanitizeText } from './text.js'

const ROOT = 'ecosort/v1'

export function firebaseReady() {
  const e = import.meta.env || {}
  return !!(e.VITE_FIREBASE_API_KEY && e.VITE_FIREBASE_DB_URL && e.VITE_FIREBASE_PROJECT_ID && e.VITE_FIREBASE_APP_ID)
}

let cached = null
async function sdk() {
  if (cached) return cached
  const [{ initializeApp, getApps }, dbMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/database'),
  ])
  const e = import.meta.env || {}
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: e.VITE_FIREBASE_API_KEY,
        authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: e.VITE_FIREBASE_DB_URL,
        projectId: e.VITE_FIREBASE_PROJECT_ID,
        storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: e.VITE_FIREBASE_SENDER_ID,
        appId: e.VITE_FIREBASE_APP_ID,
        measurementId: e.VITE_FIREBASE_MEASUREMENT_ID,
      })
  const db = dbMod.getDatabase(app)
  // Analytics is best-effort (unsupported browsers/adblock must not break us).
  let analytics = null
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    if (await isSupported().catch(() => false)) analytics = getAnalytics(app)
  } catch { /* ignore */ }
  cached = { app, db, dbMod, analytics }
  return cached
}

export async function logEventSafe(name, params) {
  try {
    const { analytics } = await sdk()
    if (!analytics) return
    const { logEvent } = await import('firebase/analytics')
    logEvent(analytics, name, params || {})
  } catch { /* ignore */ }
}

const withTimeout = (p, ms) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])

// True server time via RTDB offset (unforgeable client-clock-independent TTLs).
let offsetCache = { at: 0, value: 0 }
async function serverNow() {
  const { db, dbMod } = await sdk()
  if (Date.now() - offsetCache.at < 60000) return Date.now() + offsetCache.value
  try {
    const snap = await withTimeout(dbMod.get(dbMod.ref(db, '.info/serverTimeOffset')), 8000)
    offsetCache = { at: Date.now(), value: Number(snap.val()) || 0 }
  } catch { /* keep old offset */ }
  return Date.now() + offsetCache.value
}

// RTDB keys forbid . $ # [ ] / — base64url is fully reversible and safe.
const schoolKey = (school) =>
  btoa(unescape(encodeURIComponent(String(school || 'School'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const schoolName = (key) => {
  try {
    const b64 = String(key || '').replace(/-/g, '+').replace(/_/g, '/')
    return decodeURIComponent(escape(atob(b64)))
  } catch {
    return String(key || 'School')
  }
}
const blankBins = () => ({ WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 })

function publicProfile(p) {
  if (!p) return null
  const { recent, seenQids, seenScans, ...rest } = p
  return { ...rest, verifiedByBin: rest.verifiedByBin || blankBins() }
}

// NOTE: AI detection is Groq-only (via /api, retried by the Scanner until it
// answers). Firebase AI Logic was removed as a vision path — its console
// toggle was off, which produced the confusing "AI service issue" errors.
// RTDB below is the state tier only.

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
export async function fbCreateProfile({ name, school, klass }) {
  const { db, dbMod } = await sdk()
  const cleanName = sanitizeText(name, 40)
  const cleanSchool = sanitizeText(school, 60)
  const cleanKlass = sanitizeText(klass, 20)
  if (!cleanName || !cleanSchool) return { ok: false, error: 'name and school are required' }
  const id = `p_${rid().slice(0, 16)}`
  const profile = {
    id,
    name: pseudonym(cleanName),
    school: cleanSchool,
    klass: cleanKlass,
    points: 0, streak: 0, scans: 0, correctDisposals: 0, co2Saved: 0, recyclableKg: 0,
    verifiedByBin: blankBins(), recent: [], seenQids: [], seenScans: [],
    dayCount: { day: null, n: 0 },
    createdAt: dbMod.serverTimestamp(), lastActiveDay: null,
  }
  await dbMod.set(dbMod.ref(db, `${ROOT}/profiles/${id}`), profile)
  logEventSafe('sign_up', { school: cleanSchool })
  return { ok: true, store: 'firebase', profile: publicProfile({ ...profile, createdAt: Date.now() }), history: [] }
}

export async function fbGetProfile(id) {
  const { db, dbMod } = await sdk()
  const snap = await dbMod.get(dbMod.ref(db, `${ROOT}/profiles/${id}`))
  const p = snap.val()
  if (!p) return { ok: false, error: 'profile not found' }
  return { ok: true, profile: publicProfile(p), history: (p.recent || []).slice(0, 20) }
}

// ---------------------------------------------------------------------------
// Disposals (mirrors api/dispose.js rules: shared scoring, mandatory QR,
// cross-school check, daily cap, idempotent qids, single-use scan records)
// ---------------------------------------------------------------------------
function validQid(qid) {
  const m = /^q_([0-9a-z]+)_([0-9a-z]+)$/i.exec(String(qid || ''))
  if (!m) return ''
  const t = parseInt(m[1], 36)
  if (!Number.isFinite(t) || t <= 0 || t > Date.now() + 60000) return ''
  if (Date.now() - t > 30 * 864e5) return ''
  return String(qid)
}

export async function fbRecordDisposal({ profileId, item = '', bin = '', qr = '', scanId = '', qid = '' }) {
  const { db, dbMod } = await sdk()
  if (!BIN_IDS.includes(bin)) return { ok: false, error: 'unknown bin' }
  const parsed = parseBinPayload(String(qr || ''))
  if (!parsed) return { ok: false, error: 'a valid bin QR code is required' }
  if (parsed.bin !== bin) return { ok: false, error: 'QR does not match claimed bin' }
  const cleanQid = validQid(qid)

  const [pSnap, schoolsSnap] = await Promise.all([
    dbMod.get(dbMod.ref(db, `${ROOT}/profiles/${profileId}`)),
    dbMod.get(dbMod.ref(db, `${ROOT}/schools`)),
  ])
  const profile = pSnap.val()
  if (!profile) return { ok: false, error: 'profile not found' }
  const seenQids = profile.seenQids || []
  if (cleanQid && seenQids.includes(cleanQid)) {
    return { ok: true, store: 'firebase', earned: 0, correct: true, scanBonus: 0, duplicate: true, profile: publicProfile(profile), history: (profile.recent || []).slice(0, 20) }
  }
  const schoolSites = {}
  schoolsSnap.forEach((child) => {
    schoolSites[child.key] = child.val()?.sites || []
  })
  const ownSites = schoolSites[schoolKey(profile.school)] || []
  if (ownSites.length > 0 && !ownSites.includes(parsed.site)) {
    const foreign = Object.entries(schoolSites).some(([sch, codes]) => sch !== schoolKey(profile.school) && codes.includes(parsed.site))
    if (foreign) return { ok: false, error: 'this bin code belongs to another school — use your own school bins' }
  }

  // Scan-record consume (transactional single-use): the Firebase equivalent
  // of HMAC scan tokens. Freshness uses RTDB server time (unforgeable).
  let scanBonus = 0
  if (scanId) {
    const scanRef = dbMod.ref(db, `${ROOT}/scans/${profileId}/${scanId}`)
    const claimed = await dbMod.runTransaction(scanRef, (scan) => {
      if (!scan || scan.used || scan.bin !== bin) return
      return { ...scan, used: true }
    })
    if (claimed.committed) {
      const now = await serverNow()
      const at = Number(claimed.snapshot.val()?.at || 0)
      if (at > 0 && now - at < SCAN_TTL_MS) scanBonus = SCAN_MATCH_BONUS
    }
  }

  const scored = scoreDisposal(item, bin)
  const earned = scored.earned + (scored.correct ? scanBonus : 0)
  // Server-time day boundaries (client clocks can't stretch the daily cap).
  const now = await serverNow()
  const today = new Date(now).toISOString().slice(0, 10)
  const yesterday = new Date(now - 864e5).toISOString().slice(0, 10)
  const dayCount = profile.dayCount?.day === today ? profile.dayCount : { day: today, n: 0 }
  if (dayCount.n >= DAILY_DISPOSAL_LIMIT) {
    return { ok: false, error: `daily disposal limit reached (${DAILY_DISPOSAL_LIMIT}/day), come back tomorrow` }
  }

  const entry = {
    id: `d${Date.now().toString(36)}`, item: String(item).slice(0, 80), bin,
    points: earned, co2: scored.co2, site: parsed.site,
    verified: scored.correct, at: dbMod.serverTimestamp(),
  }
  // One atomic transaction over the whole profile doc: concurrent disposals
  // (two tabs) serialize server-side instead of last-writer-wins. The qid
  // and cap pre-checks above give friendly errors; they are re-verified here.
  const tx = await dbMod.runTransaction(dbMod.ref(db, `${ROOT}/profiles/${profileId}`), (p) => {
    if (!p) return
    const seen = p.seenQids || []
    if (cleanQid && seen.includes(cleanQid)) return
    const dc = p.dayCount?.day === today ? p.dayCount : { day: today, n: 0 }
    if (dc.n >= DAILY_DISPOSAL_LIMIT) return
    const vb = { ...blankBins(), ...(p.verifiedByBin || {}) }
    const next = {
      ...p,
      points: (p.points || 0) + earned,
      scans: (p.scans || 0) + 1,
      correctDisposals: (p.correctDisposals || 0) + (scored.correct ? 1 : 0),
      co2Saved: Math.round(((p.co2Saved || 0) + scored.co2) * 100) / 100,
      recyclableKg: Math.round(((p.recyclableKg || 0) + (scored.correct && (bin === 'RECYCLABLE' || bin === 'E_WASTE') ? KG_PER_RECYCLABLE_ITEM : 0)) * 100) / 100,
      verifiedByBin: scored.correct ? { ...vb, [bin]: (vb[bin] || 0) + 1 } : vb,
      recent: [entry, ...(p.recent || [])].slice(0, 20),
      seenQids: cleanQid ? [...seen, cleanQid].slice(-1000) : seen,
      dayCount: { day: today, n: dc.n + 1 },
    }
    if (scored.correct && p.lastActiveDay !== today) {
      next.streak = p.lastActiveDay === yesterday ? (p.streak || 0) + 1 : 1
      next.lastActiveDay = today
    }
    return next
  })
  if (!tx.committed) {
    // Aborted: either a duplicate (already counted) or a cap hit that landed
    // between pre-check and commit — re-read to answer precisely.
    const cur = (await dbMod.get(dbMod.ref(db, `${ROOT}/profiles/${profileId}`))).val()
    if (cur && cleanQid && (cur.seenQids || []).includes(cleanQid)) {
      return { ok: true, store: 'firebase', earned: 0, correct: true, scanBonus: 0, duplicate: true, profile: publicProfile(cur), history: (cur.recent || []).slice(0, 20) }
    }
    return { ok: false, error: 'conflict, try again' }
  }
  const updates = {
    [`${ROOT}/counters/disposals`]: dbMod.increment(1),
    [`${ROOT}/counters/co2`]: dbMod.increment(Math.round(scored.co2 * 100) / 100),
  }
  if (!ownSites.includes(parsed.site)) {
    updates[`${ROOT}/schools/${schoolKey(profile.school)}/sites`] = [...ownSites, parsed.site].slice(-10)
  }
  await dbMod.update(dbMod.ref(db), updates)
  logEventSafe('dispose', { bin, correct: scored.correct })
  // Re-read for resolved server timestamps (the local copy still holds the
  // serverTimestamp() sentinel, which would render as an invalid date).
  const fresh = (await dbMod.get(dbMod.ref(db, `${ROOT}/profiles/${profileId}`))).val() || {}
  const history = (fresh.recent || []).map((h) => ({ ...h, at: typeof h.at === 'number' ? h.at : Date.now() })).slice(0, 20)
  return { ok: true, store: 'firebase', earned, correct: scored.correct, scanBonus, profile: publicProfile(fresh), history }
}

// Record an AI scan for later single-use bonus claims. Returns scan {id,bin,at}.
export async function fbRecordScan({ profileId, item = '', bin = BIN_IDS[0] }) {
  const { db, dbMod } = await sdk()
  if (!profileId) return { ok: false, error: 'profile required' }
  const scanRef = dbMod.push(dbMod.ref(db, `${ROOT}/scans/${profileId}`))
  await dbMod.set(scanRef, { bin, item: String(item).slice(0, 80), at: dbMod.serverTimestamp(), used: false })
  return { ok: true, scan: { id: scanRef.key, bin } }
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------
export async function fbGetChallenges(profileId) {
  const { db, dbMod } = await sdk()
  const [idxSnap, mySnap] = await Promise.all([
    dbMod.get(dbMod.ref(db, `${ROOT}/challengesIndex`)),
    profileId ? dbMod.get(dbMod.ref(db, `${ROOT}/challenges/${profileId}`)) : { val: () => null },
  ])
  const idx = idxSnap.val() || {}
  const mine = mySnap.val() || {}
  const challenges = CHALLENGES.map((c) => ({ ...c, joined: idx[c.id]?.joins || 0 }))
  const joined = []
  const progress = {}
  const completedList = []
  for (const c of CHALLENGES) {
    const rec = mine[c.id]
    if (rec && (rec.progress !== undefined || rec.completed)) {
      joined.push(c.id)
      progress[c.id] = rec.progress || 0
      if (rec.completed) completedList.push(c.id)
    }
  }
  return { ok: true, challenges, joined, progress, completed: completedList }
}

export async function fbChallengeAction({ profileId, action, id }) {
  const { db, dbMod } = await sdk()
  const challenge = CHALLENGES.find((c) => c.id === id)
  if (!challenge) return { ok: false, error: 'challenge not found' }
  const recRef = dbMod.ref(db, `${ROOT}/challenges/${profileId}/${id}`)
  const pRef = dbMod.ref(db, `${ROOT}/profiles/${profileId}`)
  const [recSnap, pSnap] = await Promise.all([dbMod.get(recRef), dbMod.get(pRef)])
  const profile = pSnap.val()
  if (!profile) return { ok: false, error: 'profile not found' }
  const rec = recSnap.val() || {}

  if (action === 'join') {
    if (rec.progress === undefined && !rec.completed) {
      const baseline = { ...blankBins(), ...(profile.verifiedByBin || {}) }
      await Promise.all([
        dbMod.set(recRef, { progress: 0, baseline, completed: false }),
        dbMod.runTransaction(dbMod.ref(db, `${ROOT}/challengesIndex/${id}/joins`), (n) => (Number(n) || 0) + 1),
      ])
    }
    const after = (await dbMod.get(recRef)).val() || { progress: 0 }
    return { ok: true, store: 'firebase', progress: after.progress || 0, profile: publicProfile(profile), baseline: after.baseline || {} }
  }

  if (action === 'step') {
    if (rec.completed) return { ok: true, progress: rec.progress || 0, completed: true, profile: publicProfile(profile) }
    if (rec.progress === undefined) return { ok: false, error: 'join the challenge first' }
    const bins = STEP_BINS[id]
    const have = haveSince(profile.verifiedByBin || {}, rec.baseline || {}, bins)
    const need = (rec.progress || 0) + 1
    if (have < need) {
      return { ok: false, error: `log a verified ${bins ? bins.map((b) => binById(b).label.toLowerCase()).join(' / ') : 'waste'} disposal first (${have}/${need})`, have, need }
    }
    // Commit via transaction (server-serialized): concurrent tabs can't both
    // advance past each other, and the completion bonus fires exactly once —
    // the update fn aborts when it observes completed=true.
    const baseline = rec.baseline || { ...blankBins(), ...(profile.verifiedByBin || {}) }
    const tx = await dbMod.runTransaction(recRef, (cur) => {
      cur = cur || {}
      if (cur.completed) return
      const next = Math.min(challenge.target, (cur.progress || 0) + 1)
      return { progress: next, baseline: cur.baseline || baseline, completed: next >= challenge.target }
    })
    if (!tx.committed) {
      const latest = (await dbMod.get(recRef)).val() || {}
      const pNow = (await dbMod.get(pRef)).val()
      return { ok: true, progress: latest.progress || 0, completed: !!latest.completed, profile: publicProfile(pNow) }
    }
    const settled = tx.snapshot.val() || {}
    let bonus = 0
    if (settled.completed && !rec.completed) {
      // Atomic increment on the points field itself — no read-modify clobber.
      bonus = challenge.points
      await dbMod.runTransaction(dbMod.ref(db, `${ROOT}/profiles/${profileId}/points`), (n) => (Number(n) || 0) + bonus)
    }
    if (bonus) logEventSafe('challenge_complete', { id })
    const pAfter = (await dbMod.get(pRef)).val()
    return { ok: true, store: 'firebase', progress: settled.progress || 0, completed: !!settled.completed, bonus, profile: publicProfile(pAfter), baseline: settled.baseline || {} }
  }
  return { ok: false, error: 'action must be join|step' }
}

// ---------------------------------------------------------------------------
// Leaderboard (same math as api/leaderboard.js: avg/student, accuracy weight)
// ---------------------------------------------------------------------------
export async function fbLeaderboard(profileId) {
  const { db, dbMod } = await sdk()
  const [allSnap, topSnap, countersSnap] = await Promise.all([
    dbMod.get(dbMod.ref(db, `${ROOT}/profiles`)),
    dbMod.get(dbMod.query(dbMod.ref(db, `${ROOT}/profiles`), dbMod.orderByChild('points'), dbMod.limitToLast(20))),
    dbMod.get(dbMod.ref(db, `${ROOT}/counters`)),
  ])
  const all = allSnap.val() || {}
  const profiles = Object.values(all)
  const bySchool = {}
  const schoolSites = {}
  for (const p of profiles) {
    const s = bySchool[p.school] || { name: p.school, points: 0, students: 0, scans: 0, correct: 0 }
    s.points += p.points || 0
    s.students += 1
    s.scans += p.scans || 0
    s.correct += p.correctDisposals || 0
    bySchool[p.school] = s
  }
  try {
    const sitesSnap = await dbMod.get(dbMod.ref(db, `${ROOT}/schools`))
    sitesSnap.forEach((child) => {
      const codes = child.val()?.sites || []
      schoolSites[schoolName(child.key)] = codes
    })
  } catch { /* optional */ }
  const maskSite = (s) => {
    const t = String(s || '')
    return t.length <= 4 ? '••••' : `${t.slice(0, 3)}••••`
  }
  const schools = Object.values(bySchool)
    .map((s) => {
      const accuracy = s.scans ? Math.round((s.correct / s.scans) * 100) : 0
      const avg = Math.round((s.points / Math.max(1, s.students)) * 10) / 10
      const score = Math.round(avg * (0.5 + accuracy / 200) * 10) / 10
      return { ...s, accuracy, avg, score, sites: (schoolSites[s.name] || []).map(maskSite) }
    })
    .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy)
    .map((s, i) => ({ rank: i + 1, ...s }))
  const top = []
  topSnap.forEach((child) => top.push(child.val()))
  const students = top
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .map((p, i) => ({ rank: i + 1, name: p.name, school: p.school, points: p.points || 0, streak: p.streak || 0, you: !!profileId && p.id === profileId }))
  const counters = countersSnap.val() || {}
  return {
    ok: true,
    schools,
    students,
    empty: profiles.length === 0,
    totals: { disposals: counters.disposals || 0, co2: Math.round((counters.co2 || 0) * 100) / 100 },
  }
}

export { CO2_ABSORBED_PER_TREE_YEAR_KG }
